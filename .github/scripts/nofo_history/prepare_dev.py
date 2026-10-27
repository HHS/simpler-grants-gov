"""Run the fixed history preparation on the deployed NOFO dev task definition.

No environment, image, command or role override is accepted. AWS authentication
and Terraform installation are supplied by the manual GitHub Actions workflow.
"""

import json
import os
import re
import shlex
import signal
import subprocess
import sys
import time
from pathlib import Path

STARTED_BY = "nofo-history-dev"
MODULE = "infra/nofos/service"
SUCCESS = "Document audit index complete: 0 events missing."
TIMEOUT = 30 * 60
COMMAND = [
    "sh",
    "-c",
    "cd /app/nofos && "
    "poetry run python manage.py shell -c "
    "'from constance import config; import sys; "
    'sys.exit("Keep DOCUMENT_HISTORY_INDEX_ENABLED disabled") '
    "if config.DOCUMENT_HISTORY_INDEX_ENABLED else None' && "
    "poetry run python manage.py backfill_document_audit_index --chunk-size 100 && "
    "poetry run python manage.py backfill_document_audit_index --check",
]


def aws(service, operation, **params):
    args = ["aws", "--no-cli-pager", service, operation, "--output", "json"]
    for key, value in params.items():
        if isinstance(value, bool):
            args.append("--" + ("" if value else "no-") + key.replace("_", "-"))
            continue
        args.append("--" + key.replace("_", "-"))
        args.append(
            json.dumps(value) if isinstance(value, (dict, list)) else str(value)
        )
    # Do not emit AWS responses or errors containing task-definition configuration.
    result = subprocess.run(args, capture_output=True, text=True, timeout=90)
    if result.returncode:
        raise RuntimeError(
            f"AWS {service} {operation} failed; check workflow role permissions."
        )
    return json.loads(result.stdout)


def output(name):
    return subprocess.check_output(
        ["terraform", f"-chdir={MODULE}", "output", "-raw", name], text=True
    ).strip()


def require_stable_service(cluster, service_name):
    response = aws("ecs", "describe-services", cluster=cluster, services=service_name)
    services = response.get("services", [])
    if response.get("failures") or len(services) != 1:
        raise RuntimeError("Cannot identify the dev service.")
    service = services[0]
    if (
        service.get("status") != "ACTIVE"
        or service.get("desiredCount", 0) < 1
        or service.get("runningCount") != service["desiredCount"]
        or service.get("pendingCount") != 0
        or len(service.get("deployments", [])) != 1
        or service["deployments"][0].get("rolloutState") != "COMPLETED"
    ):
        raise RuntimeError(
            "Dev rollout is not complete. Wait for deployment before retrying."
        )
    arns = aws("ecs", "list-tasks", cluster=cluster, service_name=service_name)[
        "taskArns"
    ]
    if len(arns) != service["desiredCount"]:
        raise RuntimeError(
            "Dev workers are still changing. Retry after rollout completes."
        )
    workers = aws("ecs", "describe-tasks", cluster=cluster, tasks=arns)
    if workers.get("failures") or len(workers.get("tasks", [])) != len(arns):
        raise RuntimeError("Cannot verify all dev workers.")
    if any(
        worker.get("lastStatus") != "RUNNING"
        or worker.get("taskDefinitionArn") != service["taskDefinition"]
        for worker in workers["tasks"]
    ):
        raise RuntimeError("Old dev workers remain. Wait for rollout before retrying.")
    return service


def wait_for_task(cluster, task_arn):
    deadline = time.monotonic() + TIMEOUT
    while time.monotonic() < deadline:
        response = aws("ecs", "describe-tasks", cluster=cluster, tasks=task_arn)
        if response.get("failures") or len(response.get("tasks", [])) != 1:
            raise RuntimeError(
                "Cannot inspect preparation task; verify its status before retrying."
            )
        task = response["tasks"][0]
        if task.get("lastStatus") == "STOPPED":
            return task
        print(f"Preparation task: {task.get('lastStatus', 'unknown')}", flush=True)
        time.sleep(15)
    raise RuntimeError("Preparation exceeded 30 minutes; requesting task stop.")


def require_no_preparation(cluster, task_definition):
    if aws("ecs", "list-tasks", cluster=cluster, started_by=STARTED_BY)["taskArns"]:
        raise RuntimeError(
            "A dev history preparation task is already active. Inspect it before retrying."
        )
    # A stop request changes desired status before the process has exited.
    family = task_definition.rsplit("/", 1)[-1].rsplit(":", 1)[0]
    stopping = aws(
        "ecs", "list-tasks", cluster=cluster, family=family, desired_status="STOPPED"
    )["taskArns"]
    for offset in range(0, len(stopping), 100):
        response = aws(
            "ecs",
            "describe-tasks",
            cluster=cluster,
            tasks=stopping[offset : offset + 100],
        )
        if response.get("failures"):
            raise RuntimeError(
                "Cannot verify earlier preparation tasks; inspect them before retrying."
            )
        if any(
            t.get("startedBy") == STARTED_BY and t.get("lastStatus") != "STOPPED"
            for t in response["tasks"]
        ):
            raise RuntimeError(
                "An earlier preparation task is still stopping. Wait before retrying."
            )


def read_counts(log_options, container_name, task_arn, diagnose=False):
    stream = f"{log_options['awslogs-stream-prefix']}/{container_name}/{task_arn.rsplit('/', 1)[-1]}"
    params = {
        "log_group_name": log_options["awslogs-group"],
        "log_stream_name": stream,
        "start_from_head": True,
        "region": log_options.get(
            "awslogs-region", os.environ.get("AWS_REGION", "us-east-1")
        ),
    }
    complete = False
    ownership_resolved = False
    diagnostic_received = False
    # Output only the application's known count messages, never arbitrary logs.
    while True:
        result = aws("logs", "get-log-events", **params)
        for event in result.get("events", []):
            message = event["message"].strip()
            if diagnose and message.startswith("NOFO_HISTORY_DIAGNOSTIC "):
                data = json.loads(message.removeprefix("NOFO_HISTORY_DIAGNOSTIC "))
                counts = data.get("counts")
                if (
                    set(data) == {"total_missing", "counts"}
                    and type(data["total_missing"]) is int
                    and data["total_missing"] >= 0
                    and isinstance(counts, dict)
                    and all(
                        re.fullmatch(
                            r"(?:nofos\.(?:nofo|section|subsection)|composer\.(?:contentguide|contentguideinstance|contentguidesection|contentguidesubsection)):(?:total|event_type_[123]|invalid_json|dict_snapshot|empty_or_invalid_list|list_snapshot|invalid_object_uuid|retained_object_ownership|live_object|uuid_field_(?:nofo|nofo_id|section|section_id|content_guide|content_guide_id|content_guide_instance|content_guide_instance_id)|retained_parent_ownership|live_parent|parent_audit_exists)",
                            key,
                        )
                        and type(value) is int
                        and value >= 0
                        for key, value in counts.items()
                    )
                ):
                    print(message, flush=True)
                    diagnostic_received = True
                continue
            if message == SUCCESS:
                complete = True
                print(message, flush=True)
            elif re.fullmatch(
                r"Document audit index: \d+ resolved, \d+ unresolved ownership\.",
                message,
            ):
                ownership_resolved = message.endswith(", 0 unresolved ownership.")
                print(message, flush=True)
            elif re.fullmatch(
                r"Document audit index incomplete: \d+ events missing\. Keep indexed reads disabled\.",
                message.removeprefix("CommandError: "),
            ):
                print(message.removeprefix("CommandError: "), flush=True)
        token = result.get("nextForwardToken")
        if not token or token == params.get("next_token"):
            return diagnostic_received if diagnose else complete and ownership_resolved
        params["next_token"] = token


def prepare():
    diagnose = sys.argv[1:] == ["--diagnose"]
    if (
        sys.argv[1:] not in ([], ["--diagnose"])
        or os.environ.get("GITHUB_REF") != "refs/heads/main"
    ):
        raise RuntimeError(
            "Run the fixed dev workflow from main; arguments are not accepted."
        )
    subprocess.run(["./bin/terraform-init", MODULE, "infra-dev"], check=True)
    cluster, service_name = output("service_cluster_name"), output("service_name")
    service = require_stable_service(cluster, service_name)
    require_no_preparation(cluster, service["taskDefinition"])
    # Pin the revision used by the service, not the latest task-definition family.
    definition = aws(
        "ecs", "describe-task-definition", task_definition=service["taskDefinition"]
    )["taskDefinition"]
    containers = [
        c for c in definition["containerDefinitions"] if c["name"] == service_name
    ]
    if len(containers) != 1:
        raise RuntimeError("Cannot identify the application container.")
    container = containers[0]
    logging = container.get("logConfiguration", {})
    options = logging.get("options", {})
    if logging.get("logDriver") != "awslogs" or not all(
        key in options for key in ("awslogs-group", "awslogs-stream-prefix")
    ):
        raise RuntimeError(
            "Application CloudWatch logs are required to verify preparation output."
        )
    result = aws(
        "ecs",
        "run-task",
        cluster=cluster,
        task_definition=service["taskDefinition"],
        started_by=STARTED_BY,
        launch_type="FARGATE",
        platform_version="1.4.0",
        network_configuration=service["networkConfiguration"],
        overrides={
            "containerOverrides": [
                {
                    "name": service_name,
                    "command": (
                        [
                            "sh",
                            "-c",
                            "cd /app/nofos && poetry run python manage.py shell -c "
                            + shlex.quote(
                                Path(__file__).with_name("diagnose_dev.py").read_text()
                            ),
                        ]
                        if diagnose
                        else COMMAND
                    ),
                }
            ]
        },
        count=1,
    )
    tasks = result.get("tasks", [])
    if not tasks:
        raise RuntimeError("Preparation task did not start.")
    task_arn = tasks[0]["taskArn"]
    print(f"Dev preparation task: {task_arn}", flush=True)
    stopped = False
    try:
        if result.get("failures"):
            raise RuntimeError("AWS reported a task launch failure.")
        task = wait_for_task(cluster, task_arn)
        stopped = True
        app_containers = [
            c for c in task.get("containers", []) if c["name"] == service_name
        ]
        complete = False
        # CloudWatch delivery may lag the task stopping; bounded retries do not
        # rerun either database command.
        for _ in range(6):
            try:
                complete = read_counts(
                    options, service_name, task_arn, diagnose=diagnose
                )
            except RuntimeError:
                pass
            if complete:
                break
            time.sleep(5)
        if len(app_containers) != 1 or app_containers[0].get("exitCode") != 0:
            raise RuntimeError(
                "Preparation failed. Keep Constance disabled; inspect the task's CloudWatch logs privately."
            )
        if not complete:
            raise RuntimeError(
                "Could not confirm completeness and zero unresolved ownership from logs. Keep Constance disabled and inspect the task."
            )
        message = (
            "Read-only dev diagnosis complete. Constance is unchanged; this does not authorize enabling indexed history."
            if diagnose
            else "Dev backfill and completeness check passed. Constance is unchanged; you may now enable DOCUMENT_HISTORY_INDEX_ENABLED in dev and test history."
        )
        print(message, flush=True)
        if os.environ.get("GITHUB_STEP_SUMMARY"):
            with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
                summary.write(f"{message}\n\nTask: `{task_arn}`\n")
    finally:
        if not stopped:
            try:
                aws(
                    "ecs",
                    "stop-task",
                    cluster=cluster,
                    task=task_arn,
                    reason="Dev history preparation interrupted or timed out",
                )
                print(
                    "Task stop requested. Confirm STOPPED before retrying.", flush=True
                )
            except Exception:
                print(
                    f"Could not stop task {task_arn}. An operator must confirm it stopped before retrying.",
                    file=sys.stderr,
                )


def interrupted(signum, frame):
    raise RuntimeError("Preparation interrupted; requesting task cleanup.")


if __name__ == "__main__":
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        prepare()
    except Exception as error:
        print(f"Preparation failed: {error}", file=sys.stderr)
        sys.exit(1)
