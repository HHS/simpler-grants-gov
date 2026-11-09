"""Launch the fixed synthetic probe using the deployed NOFO infra-dev definition."""

import ast
import base64
import hashlib
import importlib.util
import json
import os
import re
import shlex
import signal
import subprocess
import sys
import time
import zlib
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
STARTED_BY = "nofo-readability-dev-probe"
ACCOUNT = "061664787759"
SERVICE = "nofos-infra-dev"
FIXTURES = {
    "synthetic-nofo-supported.pdf": "23347518a1a72c0be5cab20a743ab37ce3b7b6ea6169815758249e5a6b69f3e1",
    "synthetic-invalid.pdf": "c66795ab6456a97bfd42cc7caef9f4f77e5efe645bc9d3caddaf025070f1542e",
}


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


shared = load_module(
    "nofo_task_helpers", HERE.parent / "nofo_history" / "prepare_dev.py"
)
probe = load_module("readability_probe", HERE / "probe.py")


def command():
    encoded = {}
    for name, checksum in FIXTURES.items():
        data = (ROOT / "scripts/tests/fixtures/readability" / name).read_bytes()
        if len(data) > 8192 or hashlib.sha256(data).hexdigest() != checksum:
            raise RuntimeError("Synthetic fixture integrity check failed.")
        encoded[name] = base64.b64encode(data).decode("ascii")
    payload = (
        (HERE / "probe.py").read_text()
        + "\nraise SystemExit(main("
        + repr(encoded)
        + "))\n"
    )
    # ECS caps the entire command override at 8 KiB. Compress only this fixed,
    # reviewed source plus fixed fixtures; there is no workflow payload input.
    payload = ast.unparse(ast.parse(payload))
    packed = base64.b64encode(zlib.compress(payload.encode(), level=9)).decode("ascii")
    bootstrap = (
        "import base64,zlib;exec(compile(zlib.decompress(base64.b64decode("
        + repr(packed)
        + ")), '<fixed-dev-probe>', 'exec'))"
    )
    result = [
        "sh",
        "-c",
        "cd /app/nofos && poetry run python -c " + shlex.quote(bootstrap),
    ]
    if (
        len(json.dumps({"containerOverrides": [{"name": SERVICE, "command": result}]}))
        > 8192
    ):
        raise RuntimeError("Fixed probe exceeds the ECS override limit.")
    return result


def validate_report(message):
    if not message.startswith(probe.PREFIX) or len(message) > 4096:
        return None
    try:
        data = json.loads(message[len(probe.PREFIX) :])
        if (
            set(data) == {"checks", "temporary_storage", "versions"}
            and isinstance(data["checks"], dict)
            and set(data["checks"]) == probe.CHECKS
            and all(type(value) is bool for value in data["checks"].values())
            and isinstance(data["temporary_storage"], dict)
            and set(data["temporary_storage"]) == probe.STORAGE_PATHS
            and all(
                value in probe.STORAGE_TYPES
                for value in data["temporary_storage"].values()
            )
            and isinstance(data["versions"], dict)
            and set(data["versions"]) <= {"pypdf", "hhs-nofo-metrics"}
            and all(
                isinstance(value, str)
                and re.fullmatch(r"[0-9]+(?:\.[0-9]+){1,3}(?:[a-z][a-z0-9.]*)?", value)
                for value in data["versions"].values()
            )
        ):
            return data
    except (ValueError, TypeError, AttributeError):
        pass
    return None


def read_report(options, task_arn):
    params = {
        "log_group_name": options["awslogs-group"],
        "log_stream_name": f"{options['awslogs-stream-prefix']}/{SERVICE}/{task_arn.rsplit('/', 1)[-1]}",
        "start_from_head": True,
        "region": "us-east-1",
    }
    reports = []
    for _ in range(10):
        response = shared.aws("logs", "get-log-events", **params)
        for event in response.get("events", []):
            report = validate_report(event.get("message", "").strip())
            if report is not None:
                reports.append(report)
        token = response.get("nextForwardToken")
        if not token or token == params.get("next_token"):
            return reports[0] if len(reports) == 1 else None
        params["next_token"] = token
    return None


def run():
    if (
        sys.argv[1:]
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
        or os.environ.get("GITHUB_REPOSITORY") != "HHS/simpler-grants-gov"
        or os.environ.get("AWS_REGION") != "us-east-1"
    ):
        raise RuntimeError("Use the fixed main-branch dev workflow without arguments.")
    if shared.aws("sts", "get-caller-identity").get("Account") != ACCOUNT:
        raise RuntimeError("Unexpected AWS account; stopped before launch.")
    # Reuse the existing state-backed discovery, but never publish init output.
    init = subprocess.run(
        ["./bin/terraform-init", shared.MODULE, "infra-dev"],
        capture_output=True,
        timeout=120,
        check=False,
    )
    if init.returncode:
        raise RuntimeError("Dev resource discovery failed.")
    cluster, service_name = shared.output("service_cluster_name"), shared.output(
        "service_name"
    )
    if service_name != SERVICE:
        raise RuntimeError("Unexpected service; stopped before launch.")
    service = shared.require_stable_service(cluster, service_name)
    shared.require_no_preparation(
        cluster, service["taskDefinition"], started_by=STARTED_BY
    )
    definition = shared.aws(
        "ecs", "describe-task-definition", task_definition=service["taskDefinition"]
    )["taskDefinition"]
    containers = [
        item for item in definition["containerDefinitions"] if item["name"] == SERVICE
    ]
    if len(containers) != 1:
        raise RuntimeError("Expected application container missing.")
    logging = containers[0].get("logConfiguration", {})
    options = logging.get("options", {})
    if logging.get("logDriver") != "awslogs" or not all(
        options.get(key) for key in ("awslogs-group", "awslogs-stream-prefix")
    ):
        raise RuntimeError("Expected task log configuration missing.")
    response = shared.aws(
        "ecs",
        "run-task",
        cluster=cluster,
        task_definition=service["taskDefinition"],
        started_by=STARTED_BY,
        launch_type="FARGATE",
        platform_version="1.4.0",
        network_configuration=service["networkConfiguration"],
        count=1,
        overrides={"containerOverrides": [{"name": SERVICE, "command": command()}]},
    )
    tasks = response.get("tasks", [])
    if not tasks:
        raise RuntimeError("Verification task did not start.")
    task_arn = tasks[0]["taskArn"]
    stopped = False
    try:
        if response.get("failures") or len(tasks) != 1:
            raise RuntimeError("Unexpected task launch result.")
        task = shared.wait_for_task(cluster, task_arn, timeout_seconds=300)
        stopped = True
        report = None
        for _ in range(6):
            try:
                report = read_report(options, task_arn)
            except Exception:
                pass
            if report is not None:
                break
            time.sleep(5)
        if report is None:
            raise RuntimeError(
                "No validated result; inspect task logs through restricted access."
            )
        summary = json.dumps(report, indent=2, sort_keys=True)
        print(summary)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as output:
                output.write(
                    "## Readability Calculator — separate dev task\n\n```json\n"
                    + summary
                    + "\n```\n\nA separate task is not evidence of live-service interruption cleanup, ingress protection, logging privacy or production readiness.\n"
                )
        app_containers = [
            item for item in task.get("containers", []) if item.get("name") == SERVICE
        ]
        if (
            len(app_containers) != 1
            or app_containers[0].get("exitCode") != 0
            or not all(report["checks"].values())
            or "unavailable" in report["temporary_storage"].values()
            or set(report["versions"]) != {"pypdf", "hhs-nofo-metrics"}
        ):
            raise RuntimeError("Verification did not pass every check.")
    finally:
        if not stopped:
            try:
                shared.aws(
                    "ecs",
                    "stop-task",
                    cluster=cluster,
                    task=task_arn,
                    reason="Bounded readability verification ended",
                )
            except Exception:
                print(
                    "Task stop could not be confirmed; infrastructure support must inspect the probe task before retrying.",
                    file=sys.stderr,
                )


def interrupted(signum, frame):
    raise RuntimeError("Verification interrupted.")


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        run()
    except Exception:
        # AWS responses, exception text and raw application logs stay private.
        print(
            "Verification failed. No public-upload enablement is authorized; inspect restricted task details if needed.",
            file=sys.stderr,
        )
        sys.exit(1)
