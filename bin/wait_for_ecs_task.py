#!/usr/bin/env python3
"""Bounded, read-only ECS migration observation. Never stops or retries a task."""

import argparse
import json
import os
import re
import subprocess
import time


def emit(**fields):
    # JSON quotes newlines/control characters, including GitHub command injection.
    print(json.dumps(fields, ensure_ascii=True), flush=True)


def reason(value):
    # Error details can contain registry credentials, SQL or application data.
    # Keep known ECS reasons/categories, not a best-effort secret denylist.
    text = str(value or "")
    if text in {
        "",
        "Essential container in task exited",
        "Task stopped by user",
        "User initiated",
    }:
        return text
    category = re.match(
        r"^(CannotPullContainerError|CannotStartContainerError|"
        r"ResourceInitializationError|OutOfMemoryError|"
        r"CannotCreateContainerError|ContainerRuntimeError)(?:[: ]|$)",
        text,
    )
    return (
        category[1] + ": details withheld"
        if category
        else "Reason details withheld; inspect the identified task privately"
    )


def aws(arguments, deadline):
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError
    result = subprocess.run(
        [
            "aws",
            "--no-cli-pager",
            "--output",
            "json",
            "--cli-connect-timeout",
            "5",
            "--cli-read-timeout",
            "10",
            *arguments,
        ],
        capture_output=True,
        text=True,
        timeout=min(30, remaining),
        env={**os.environ, "AWS_MAX_ATTEMPTS": "1"},
    )
    if result.returncode:
        # CLI errors may include request arguments or credentials; do not echo them.
        raise RuntimeError("AWS diagnostic/status request failed")
    return json.loads(result.stdout)


def describe(cluster, task, region, deadline):
    response = aws(
        [
            "ecs",
            "describe-tasks",
            "--region",
            region,
            "--cluster",
            cluster,
            "--tasks",
            task,
        ],
        deadline,
    )
    tasks = response.get("tasks", [])
    if response.get("failures") or len(tasks) != 1 or tasks[0].get("taskArn") != task:
        raise ValueError("Exact task status unavailable")
    return tasks[0]


def diagnostics(cluster, task, container, region, last):
    # Separate small budget: diagnostics cannot make the migration wait unbounded.
    deadline = time.monotonic() + 60
    try:
        last = describe(cluster, task, region, deadline)
    except (RuntimeError, ValueError, TimeoutError, subprocess.TimeoutExpired, OSError):
        emit(diagnostics="Fresh task status unavailable; last observation follows")
    if last:
        emit(
            task=task,
            status=last.get("lastStatus"),
            may_still_be_active=last.get("lastStatus") != "STOPPED",
            stop_code=last.get("stopCode"),
            stop_reason=reason(last.get("stoppedReason")),
            containers=[
                {
                    "name": c.get("name"),
                    "status": c.get("lastStatus"),
                    "exit_code": c.get("exitCode"),
                    "reason": reason(c.get("reason")),
                }
                for c in last.get("containers", [])
            ],
        )
    else:
        emit(task=task, status="unknown", may_still_be_active=True)
    try:
        if not last or not last.get("taskDefinitionArn"):
            raise ValueError("Task definition unavailable")
        definition = aws(
            [
                "ecs",
                "describe-task-definition",
                "--region",
                region,
                "--task-definition",
                last["taskDefinitionArn"],
            ],
            deadline,
        )
        selected = next(
            c
            for c in definition["taskDefinition"]["containerDefinitions"]
            if c["name"] == container
        )
        config = selected.get("logConfiguration", {})
        options = config.get("options", {})
        if config.get("logDriver") != "awslogs":
            raise ValueError("No supported CloudWatch log configuration")
        group = options["awslogs-group"]
        stream = (
            f'{options["awslogs-stream-prefix"]}/{container}/{task.rsplit("/", 1)[-1]}'
        )
        emit(log_group=group, log_stream=stream)
        logs = aws(
            [
                "logs",
                "get-log-events",
                "--region",
                options.get("awslogs-region", region),
                "--log-group-name",
                group,
                "--log-stream-name",
                stream,
                "--limit",
                "100",
                "--no-paginate",
            ],
            deadline,
        )
        shown = 0
        for event in logs.get("events", []):
            message = event.get("message", "").strip()
            # Do not publish arbitrary application text/SQL/tracebacks or secrets.
            if re.fullmatch(
                r"(?:Applying [A-Za-z0-9_]+\.[A-Za-z0-9_]+\.\.\. OK|"
                r"Running migrations:|Operations to perform:|No migrations to apply\.)",
                message,
            ):
                emit(migration_progress=message)
                shown += 1
        emit(
            log_events_shown=shown,
            log_events_withheld=len(logs.get("events", [])) - shown,
        )
    except (
        RuntimeError,
        ValueError,
        KeyError,
        StopIteration,
        TypeError,
        TimeoutError,
        subprocess.TimeoutExpired,
        OSError,
    ):
        emit(diagnostics="Container logs unavailable; original failure is preserved")


def wait(cluster, task, container, region, timeout):
    started = time.monotonic()
    deadline = started + timeout
    last = None
    status = 1
    try:
        while time.monotonic() < deadline:
            last = describe(cluster, task, region, deadline)
            emit(
                task=task,
                elapsed_seconds=int(time.monotonic() - started),
                status=last.get("lastStatus"),
            )
            if last.get("lastStatus") == "STOPPED":
                selected = [
                    c for c in last.get("containers", []) if c.get("name") == container
                ]
                if (
                    len(selected) == 1
                    and selected[0].get("lastStatus") == "STOPPED"
                    and type(selected[0].get("exitCode")) is int
                    and selected[0]["exitCode"] == 0
                ):
                    emit(result="Task complete", exit_code=0)
                    return 0
                emit(result="Migration container did not exit successfully")
                break
            time.sleep(min(15, max(0, deadline - time.monotonic())))
        else:
            raise TimeoutError
    except (TimeoutError, subprocess.TimeoutExpired):
        status = 124
        emit(result="Migration wait budget exceeded", timeout_seconds=timeout)
    except (RuntimeError, ValueError, KeyError, TypeError, AttributeError, OSError):
        emit(result="Cannot establish migration success; rollout blocked")
    try:
        diagnostics(cluster, task, container, region, last)
    except (
        RuntimeError,
        ValueError,
        KeyError,
        TypeError,
        AttributeError,
        TimeoutError,
        subprocess.TimeoutExpired,
        OSError,
    ):
        emit(diagnostics="Diagnostic collection failed; original failure is preserved")
    emit(
        retry="Do not launch another migration until this exact task is confirmed stopped. "
        "A workflow timeout does not stop an ECS task; inspect database state before retry."
    )
    return status


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("cluster", "task", "container", "region"):
        parser.add_argument(f"--{name}", required=True)
    parser.add_argument("--timeout-seconds", required=True, type=int)
    args = parser.parse_args()
    if not 1 <= args.timeout_seconds <= 7200:
        parser.error("timeout-seconds must be between 1 and 7200")
    return wait(
        args.cluster, args.task, args.container, args.region, args.timeout_seconds
    )


if __name__ == "__main__":
    raise SystemExit(main())
