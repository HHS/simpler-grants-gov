"""Fixed production-only read-only check; never calls the dev preparation runner."""

import json
import os
import shlex
import signal
import sys
import time
from pathlib import Path

import check_production_source as probe
import prepare_dev as shared

MARKER = "NOFO_HISTORY_PRODUCTION_CHECK "
STARTED_BY = "nofo-history-prod-check"
STATUSES = {
    "ready",
    "index_incomplete",
    "empty_audit",
    "target_missing",
    "target_empty",
    "coverage_mismatch",
    "reader_enabled",
    "query_timeout",
    "check_failed",
}


def build_command():
    source = Path(__file__).with_name("check_production_source.py").read_text()
    source += "\nimport sys; sys.exit(0 if check() else 1)"
    return [
        "sh",
        "-c",
        "cd /app/nofos && poetry run python manage.py shell -c " + shlex.quote(source),
    ]


def validated_report(message):
    if not message.startswith(MARKER):
        return None
    try:
        data = json.loads(message[len(MARKER) :])
        counts = data["counts"]
        if (
            set(data) != {"status", "counts"}
            or data["status"] not in STATUSES
            or set(counts) != probe.FIELDS
            or not all(type(v) is int and v >= 0 for v in counts.values())
        ):
            return None
        if data["status"] == "ready" and not (
            counts["reader_enabled"]
            == counts["missing_events"]
            == counts["legacy_only_events"]
            == counts["indexed_only_events"]
            == 0
            and counts["coverage_checked"] == 1
            and counts["relevant_events"] == counts["indexed_events"] > 0
            and counts["legacy_visible_events"] == counts["indexed_visible_events"] > 0
        ):
            return None
        return data
    except (ValueError, KeyError, TypeError):
        return None


def read_report(options, container, arn):
    params = {
        "log_group_name": options["awslogs-group"],
        "log_stream_name": f"{options['awslogs-stream-prefix']}/{container}/{arn.rsplit('/', 1)[-1]}",
        "start_from_head": True,
        "limit": 1000,
        "region": options.get(
            "awslogs-region", os.environ.get("AWS_REGION", "us-east-1")
        ),
    }
    for _ in range(10):
        page = shared.aws("logs", "get-log-events", **params)
        for event in page.get("events", []):
            report = validated_report(event["message"].strip())
            if report:
                print(MARKER + json.dumps(report, sort_keys=True), flush=True)
                return report
        token = page.get("nextForwardToken")
        if not token or token == params.get("next_token"):
            break
        params["next_token"] = token
    return None


def main():
    if len(sys.argv) != 1 or os.environ.get("GITHUB_REF") != "refs/heads/main":
        raise RuntimeError(
            "Run the production check from main; no arguments are accepted."
        )
    shared.subprocess.run(["./bin/terraform-init", shared.MODULE, "prod"], check=True)
    cluster, service_name = shared.output("service_cluster_name"), shared.output(
        "service_name"
    )
    service = shared.require_stable_service(cluster, service_name, label="Production")
    shared.require_no_preparation(
        cluster, service["taskDefinition"], started_by=STARTED_BY, label="production"
    )
    definition = shared.aws(
        "ecs", "describe-task-definition", task_definition=service["taskDefinition"]
    )["taskDefinition"]
    containers = [
        c for c in definition["containerDefinitions"] if c["name"] == service_name
    ]
    if len(containers) != 1:
        raise RuntimeError("Cannot identify the production application container.")
    logging = containers[0].get("logConfiguration", {})
    options = logging.get("options", {})
    if logging.get("logDriver") != "awslogs" or not all(
        k in options for k in ("awslogs-group", "awslogs-stream-prefix")
    ):
        raise RuntimeError("CloudWatch result evidence is required.")
    overrides = {
        "containerOverrides": [{"name": service_name, "command": build_command()}]
    }
    if len(json.dumps(overrides).encode()) >= 8192:
        raise RuntimeError("Fixed check exceeds the ECS command size limit.")
    result = shared.aws(
        "ecs",
        "run-task",
        cluster=cluster,
        task_definition=service["taskDefinition"],
        started_by=STARTED_BY,
        launch_type="FARGATE",
        platform_version="1.4.0",
        network_configuration=service["networkConfiguration"],
        overrides=overrides,
        count=1,
    )
    if not result.get("tasks"):
        raise RuntimeError("Production check task did not start.")
    arn = result["tasks"][0]["taskArn"]
    print(f"Read-only production check task: {arn}", flush=True)
    stopped = False
    try:
        if result.get("failures"):
            raise RuntimeError("AWS reported a launch failure.")
        task = shared.wait_for_task(cluster, arn, timeout_seconds=300)
        stopped = True
        report = None
        for _ in range(6):
            try:
                report = read_report(options, service_name, arn)
            except RuntimeError:
                pass
            if report:
                break
            time.sleep(5)
        if report and os.environ.get("GITHUB_STEP_SUMMARY"):
            with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
                summary.write(
                    "Production history readiness: **"
                    + report["status"]
                    + "**\n\nNo backfill or switch change performed. This does not authorize enablement.\n\n```json\n"
                    + json.dumps(report, indent=2, sort_keys=True)
                    + "\n```\n"
                )
        app = [c for c in task.get("containers", []) if c["name"] == service_name]
        if not report:
            raise RuntimeError(
                "No validated result available. Keep the switch unchanged and inspect the task privately."
            )
        if report["status"] != "ready":
            raise RuntimeError(
                "Production history is not ready: "
                + report["status"]
                + ". No changes performed."
            )
        if len(app) != 1 or app[0].get("exitCode") != 0:
            raise RuntimeError("Production check container did not exit successfully.")
        print(
            "Read-only readiness checks passed. Production switch is unchanged; enablement requires a separate decision.",
            flush=True,
        )
    finally:
        if not stopped:
            try:
                shared.aws(
                    "ecs",
                    "stop-task",
                    cluster=cluster,
                    task=arn,
                    reason="Read-only production history check interrupted or timed out",
                )
                print("Stop requested; confirm STOPPED before retrying.", flush=True)
            except Exception:
                print(
                    f"Could not stop task {arn}; confirm STOPPED before retrying.",
                    file=sys.stderr,
                )


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, shared.interrupted)
    signal.signal(signal.SIGINT, shared.interrupted)
    try:
        main()
    except Exception as error:
        print(f"Production check stopped: {error}", file=sys.stderr)
        sys.exit(1)
