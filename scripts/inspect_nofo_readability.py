"""Read-only infra-dev inspection. Never print AWS responses or exception text."""

import json
import os
import re
import subprocess
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

ACCOUNT = "061664787759"
REGION = "us-east-1"
SERVICE = "nofos-infra-dev"
RULES = {
    "emergency": "NOFO-PDFReadability-EmergencyBlock",
    "upload_rate": "NOFO-PDFReadability-UploadRate",
}
ALARM_NAMES = {
    "emergency": f"{SERVICE}-pdf-readability-emergency-blocks",
    "upload_rate": f"{SERVICE}-pdf-readability-upload_rate-blocks",
    "cpu": f"{SERVICE}-pdf-readability-high-cpu",
    "memory": f"{SERVICE}-pdf-readability-high-memory",
}
# Keep this exact allowlist synchronized with the workflow's session policy.
READ_OPERATIONS = {
    ("sts", "get-caller-identity"): "sts:GetCallerIdentity",
    ("ecs", "describe-services"): "ecs:DescribeServices",
    ("ecs", "list-tasks"): "ecs:ListTasks",
    ("ecs", "describe-tasks"): "ecs:DescribeTasks",
    ("ecs", "describe-task-definition"): "ecs:DescribeTaskDefinition",
    ("elbv2", "describe-target-groups"): "elasticloadbalancing:DescribeTargetGroups",
    ("wafv2", "get-web-acl-for-resource"): "wafv2:GetWebACLForResource",
    ("cloudwatch", "get-dashboard"): "cloudwatch:GetDashboard",
    ("cloudwatch", "describe-alarms"): "cloudwatch:DescribeAlarms",
    ("cloudwatch", "get-metric-statistics"): "cloudwatch:GetMetricStatistics",
    ("sns", "list-subscriptions-by-topic"): "sns:ListSubscriptionsByTopic",
    ("logs", "describe-log-groups"): "logs:DescribeLogGroups",
    ("logs", "describe-subscription-filters"): "logs:DescribeSubscriptionFilters",
}

# AWS checks these additional read permissions inside GetWebACLForResource for ALBs.
# https://docs.aws.amazon.com/waf/latest/developerguide/security_iam_service-with-iam.html
DEPENDENT_READ_ACTIONS = {
    "wafv2:GetWebACL",
    "elasticloadbalancing:GetLoadBalancerWebACL",
}


class InspectionError(Exception):
    """Only fixed categories may reach the report."""


def number(value):
    return value if type(value) in (int, float) and 0 <= value < 10**12 else None


def revision(arn):
    suffix = str(arn).rsplit(":", 1)[-1]
    return int(suffix) if re.fullmatch(r"[0-9]{1,8}", suffix) else None


def image_version(image):
    tag = str(image).rsplit(":", 1)[-1]
    return (
        tag
        if re.fullmatch(r"(?:[a-f0-9]{7,40}|v?\d+\.\d+\.\d+|main)", tag)
        else "unrecognized"
    )


def setting(environment, name, retention=False):
    # Report only the explicitly selected configuration, never arbitrary values.
    if name not in environment:
        return "unset; application default not inspected"
    value = environment[name]
    if retention:
        return int(value) if re.fullmatch(r"[1-9][0-9]{0,5}", value) else "other"
    return value.lower() if value.lower() in {"true", "false"} else "other"


class Aws:
    def __init__(self):
        self.deadline = time.monotonic() + 180

    def get(self, service, operation, *args):
        if (service, operation) not in READ_OPERATIONS:
            raise InspectionError("operation_not_allowed")
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise InspectionError("inspection_deadline")
        try:
            result = subprocess.run(
                [
                    "aws",
                    service,
                    operation,
                    *args,
                    "--region",
                    REGION,
                    "--output",
                    "json",
                    "--no-cli-pager",
                    "--cli-connect-timeout",
                    "5",
                    "--cli-read-timeout",
                    "10",
                ],
                capture_output=True,
                text=True,
                timeout=min(20, remaining),
                env={**os.environ, "AWS_MAX_ATTEMPTS": "1", "AWS_PAGER": ""},
                check=False,
            )
        except subprocess.TimeoutExpired:
            raise InspectionError("request_timeout") from None
        except OSError:
            raise InspectionError("aws_cli_unavailable") from None
        if result.returncode:
            category = (
                "access_denied"
                if re.search(r"AccessDenied|UnauthorizedOperation", result.stderr)
                else (
                    "not_found"
                    if re.search(
                        r"ResourceNotFound|WAFNonexistentItem|ClusterNotFound",
                        result.stderr,
                    )
                    else "aws_request_failed"
                )
            )
            raise InspectionError(category)
        try:
            data = json.loads(result.stdout)
            if not isinstance(data, dict):
                raise ValueError
            return data
        except (ValueError, TypeError):
            raise InspectionError("invalid_response") from None


def task_summary(definition):
    containers = definition.get("containerDefinitions", [])
    container = next((c for c in containers if c.get("name") == SERVICE), None)
    if container is None:
        raise InspectionError("expected_container_missing")
    environment = {
        item["name"]: str(item.get("value", ""))
        for item in container.get("environment", [])
    }
    linux = container.get("linuxParameters", {})
    user = container.get("user")
    return {
        "revision": revision(definition.get("taskDefinitionArn")),
        "image_version": image_version(container.get("image")),
        "user_configuration": (
            "unspecified"
            if not user
            else "root" if str(user).split(":")[0] in {"root", "0"} else "other_user"
        ),
        "read_only_root_configured": container.get("readonlyRootFilesystem") is True,
        "drop_all_capabilities_configured": "ALL"
        in linux.get("capabilities", {}).get("drop", []),
        "tmpfs_declared_for_tmp": any(
            mount.get("containerPath") == "/tmp" for mount in linux.get("tmpfs", [])
        ),
        "public_recording_environment": setting(
            environment, "PDF_READABILITY_ATTEMPT_RECORDING_ENABLED"
        ),
        "authenticated_recording_environment": setting(
            environment, "AUTHENTICATED_PDF_READABILITY_ATTEMPT_RECORDING_ENABLED"
        ),
        "public_retention_environment": setting(
            environment, "PDF_READABILITY_ATTEMPT_RETENTION_DAYS", retention=True
        ),
        "authenticated_retention_environment": setting(
            environment,
            "AUTHENTICATED_PDF_READABILITY_ATTEMPT_RETENTION_DAYS",
            retention=True,
        ),
        "awslogs_configured": container.get("logConfiguration", {}).get("logDriver")
        == "awslogs",
    }, container.get("logConfiguration", {}).get("options", {}).get("awslogs-group")


def expected_scope(key):
    """Exact supported deployed shape; mismatches are not a claim of no coverage."""
    transforms = [{"Priority": 0, "Type": "NONE"}]
    path = {
        "RegexMatchStatement": {
            "RegexString": "^/readability-checker/?$|^/readability/?$",
            "FieldToMatch": {"UriPath": {}},
            "TextTransformations": transforms,
        }
    }
    if key == "emergency":
        method = {
            "RegexMatchStatement": {
                "RegexString": "^(GET|POST)$",
                "FieldToMatch": {"Method": {}},
                "TextTransformations": transforms,
            }
        }
    else:
        method = {
            "ByteMatchStatement": {
                "SearchString": "POST",
                "PositionalConstraint": "EXACTLY",
                "FieldToMatch": {"Method": {}},
                "TextTransformations": transforms,
            }
        }
    return {"AndStatement": {"Statements": [path, method]}}


def scope_matches(statement, key):
    # AWS CLI serializes blob SearchString as base64. Accept only the two
    # fixed representations of POST, never decode/print arbitrary payloads.
    statement = json.loads(json.dumps(statement))
    if key == "upload_rate":
        for child in statement.get("AndStatement", {}).get("Statements", []):
            byte = child.get("ByteMatchStatement", {})
            if byte.get("SearchString") == "UE9TVA==":
                byte["SearchString"] = "POST"
    expected = expected_scope(key)
    actual_children = statement.get("AndStatement", {}).get("Statements", [])
    expected_children = expected["AndStatement"]["Statements"]
    return (
        set(statement) == {"AndStatement"}
        and set(statement["AndStatement"]) == {"Statements"}
        and len(actual_children) == 2
        and all(child in actual_children for child in expected_children)
    )


def waf_summary(acl):
    rules = acl.get("Rules", [])
    selected = {}
    for key, name in RULES.items():
        rule = next((r for r in rules if r.get("Name") == name), None)
        if rule is None:
            raise InspectionError("expected_rule_missing")
        rate = rule.get("Statement", {}).get("RateBasedStatement", {})
        action = next(iter(rule.get("Action", {})), "unknown")
        selected[key] = {
            "scope_matches_reviewed_paths_and_methods": scope_matches(
                (
                    rate.get("ScopeDownStatement", {})
                    if key == "upload_rate"
                    else rule.get("Statement", {})
                ),
                key,
            ),
            "rule_metric_name_matches_rule_name": rule.get("VisibilityConfig", {}).get(
                "MetricName"
            )
            == name,
            "priority": number(rule.get("Priority")),
            "action": action if action in {"Count", "Block"} else "other",
            "metrics_enabled": rule.get("VisibilityConfig", {}).get(
                "CloudWatchMetricsEnabled"
            )
            is True,
            "sampling_enabled": rule.get("VisibilityConfig", {}).get(
                "SampledRequestsEnabled"
            )
            is True,
        }
        if key == "upload_rate":
            selected[key].update(
                limit=number(rate.get("Limit")),
                evaluation_window_seconds=number(rate.get("EvaluationWindowSec")),
                aggregates_by_ip=rate.get("AggregateKeyType") == "IP",
            )
    others = [r.get("Priority") for r in rules if r.get("Name") not in RULES.values()]
    priorities = [r["priority"] for r in selected.values()]
    return {
        "rules": selected,
        "pilot_rules_before_other_rules": (
            all(type(p) is int for p in [*priorities, *others])
            and all(p < other for p in priorities for other in others)
        ),
    }


class Inspector:
    def __init__(self, aws):
        self.aws = aws
        self.results = []

    def check(self, name, function):
        try:
            details = function()
            self.results.append(
                {
                    "check": name,
                    "status": (
                        "incomplete" if details.get("complete") is False else "observed"
                    ),
                    "details": details,
                }
            )
            return details
        except InspectionError as error:
            self.results.append({"check": name, "status": str(error)})
        except Exception:
            # AWS configuration can contain arbitrary strings. Never print a traceback.
            self.results.append({"check": name, "status": "unexpected_response"})
        return None

    def service(self):
        response = self.aws.get(
            "ecs", "describe-services", "--cluster", SERVICE, "--services", SERVICE
        )
        if response.get("failures") or len(response.get("services", [])) != 1:
            raise InspectionError("service_not_found")
        service = response["services"][0]
        self.service_data = service
        return {
            "desired_tasks": number(service.get("desiredCount")),
            "running_tasks": number(service.get("runningCount")),
            "pending_tasks": number(service.get("pendingCount")),
            "ecs_exec_enabled": service.get("enableExecuteCommand") is True,
            "configured_task_definition_revision": revision(
                service.get("taskDefinition")
            ),
        }

    def tasks(self):
        response = self.aws.get(
            "ecs",
            "list-tasks",
            "--cluster",
            SERVICE,
            "--service-name",
            SERVICE,
            "--desired-status",
            "RUNNING",
            "--cli-input-json",
            '{"maxResults":20}',
            "--no-paginate",
        )
        if response.get("nextToken") or len(response.get("taskArns", [])) > 20:
            raise InspectionError("task_list_truncated")
        arns = response.get("taskArns", [])
        if not arns:
            raise InspectionError("no_running_tasks")
        response = self.aws.get(
            "ecs", "describe-tasks", "--cluster", SERVICE, "--tasks", *arns
        )
        if response.get("failures") or len(response.get("tasks", [])) != len(arns):
            raise InspectionError("running_tasks_incomplete")
        if any(task.get("lastStatus") != "RUNNING" for task in response["tasks"]):
            raise InspectionError("running_tasks_changed")
        definitions = {task["taskDefinitionArn"] for task in response["tasks"]}
        self.log_groups = set()
        summaries = []
        for arn in sorted(definitions):
            definition = self.aws.get(
                "ecs", "describe-task-definition", "--task-definition", arn
            )["taskDefinition"]
            summary, log_group = task_summary(definition)
            summaries.append(summary)
            if log_group:
                self.log_groups.add(log_group)
        return {"running_definition_count": len(summaries), "definitions": summaries}

    def waf(self):
        bindings = getattr(self, "service_data", {}).get("loadBalancers", [])
        if not bindings:
            raise InspectionError("load_balancer_not_discovered")
        groups = self.aws.get(
            "elbv2",
            "describe-target-groups",
            "--target-group-arns",
            *sorted({b["targetGroupArn"] for b in bindings}),
        ).get("TargetGroups", [])
        lbs = {arn for g in groups for arn in g.get("LoadBalancerArns", [])}
        if len(lbs) != 1:
            raise InspectionError("load_balancer_ambiguous")
        acl = self.aws.get(
            "wafv2", "get-web-acl-for-resource", "--resource-arn", next(iter(lbs))
        ).get("WebACL")
        if not acl:
            raise InspectionError("no_web_acl_association")
        self.waf_metric = acl.get("VisibilityConfig", {}).get("MetricName")
        self.rule_metrics = {
            key: next(
                (
                    r.get("VisibilityConfig", {}).get("MetricName")
                    for r in acl.get("Rules", [])
                    if r.get("Name") == name
                ),
                None,
            )
            for key, name in RULES.items()
        }
        return waf_summary(acl)

    def dashboard(self):
        data = self.aws.get(
            "cloudwatch",
            "get-dashboard",
            "--dashboard-name",
            f"{SERVICE}-pdf-readability",
        )
        widgets = json.loads(data["DashboardBody"]).get("widgets", [])
        return {"widget_count": len(widgets), "complete": bool(widgets)}

    def alarms(self):
        data = self.aws.get(
            "cloudwatch", "describe-alarms", "--alarm-names", *ALARM_NAMES.values()
        )
        found = {a["AlarmName"]: a for a in data.get("MetricAlarms", [])}
        result = {}
        for key, name in ALARM_NAMES.items():
            alarm = found.get(name)
            if alarm is None:
                result[key] = {"present": False}
                continue
            state = alarm.get("StateValue")
            result[key] = {
                "present": True,
                "state": (
                    state if state in {"OK", "ALARM", "INSUFFICIENT_DATA"} else "other"
                ),
                "notifications_enabled": alarm.get("ActionsEnabled") is True,
                "alarm_destination_count": len(alarm.get("AlarmActions", [])),
                "recovery_destination_count": len(alarm.get("OKActions", [])),
                "uses_expected_alarm_topic": alarm.get("AlarmActions", [])
                == [f"arn:aws:sns:{REGION}:{ACCOUNT}:{SERVICE}-monitoring"],
                "threshold": number(alarm.get("Threshold")),
            }
        return {
            "alarms": result,
            "complete": all(a["present"] for a in result.values()),
        }

    def subscriptions(self):
        # Fixed NOFO topic; never follow arbitrary endpoints or print addresses.
        data = self.aws.get(
            "sns",
            "list-subscriptions-by-topic",
            "--topic-arn",
            f"arn:aws:sns:{REGION}:{ACCOUNT}:{SERVICE}-monitoring",
            "--no-paginate",
        )
        if data.get("NextToken"):
            raise InspectionError("subscription_list_truncated")
        subscriptions = data.get("Subscriptions", [])
        protocols = Counter(s.get("Protocol") for s in subscriptions)
        return {
            "total": len(subscriptions),
            "email": protocols["email"],
            "https": protocols["https"],
            "other": len(subscriptions) - protocols["email"] - protocols["https"],
            "pending_confirmation": sum(
                s.get("SubscriptionArn") == "PendingConfirmation" for s in subscriptions
            ),
            "delivery_tested": False,
        }

    def metrics(self):
        end = datetime.now(timezone.utc)
        start = end - timedelta(hours=1)
        requests = [
            (
                key,
                "AWS/ECS",
                metric,
                [
                    {"Name": "ClusterName", "Value": SERVICE},
                    {"Name": "ServiceName", "Value": SERVICE},
                ],
                "Average",
            )
            for key, metric in (
                ("cpu", "CPUUtilization"),
                ("memory", "MemoryUtilization"),
            )
        ]
        if getattr(self, "waf_metric", None):
            requests += [
                (
                    f"{key}_{metric}",
                    "AWS/WAFV2",
                    metric,
                    [
                        {"Name": "WebACL", "Value": self.waf_metric},
                        {"Name": "Rule", "Value": rule},
                        {"Name": "Region", "Value": REGION},
                    ],
                    "Sum",
                )
                for key, rule in self.rule_metrics.items()
                if isinstance(rule, str) and rule
                for metric in ("CountedRequests", "BlockedRequests")
            ]
        result = {}
        for key, namespace, metric, dimensions, statistic in requests:
            data = self.aws.get(
                "cloudwatch",
                "get-metric-statistics",
                "--namespace",
                namespace,
                "--metric-name",
                metric,
                "--dimensions",
                json.dumps(dimensions),
                "--start-time",
                start.isoformat(),
                "--end-time",
                end.isoformat(),
                "--period",
                "300",
                "--statistics",
                statistic,
            )
            result[key] = {"datapoints_last_hour": len(data.get("Datapoints", []))}
            if namespace == "AWS/WAFV2":
                values = [
                    row["Sum"]
                    for row in data.get("Datapoints", [])
                    if number(row.get("Sum")) is not None
                ]
                result[key]["sum_last_hour"] = sum(values) if values else None
        for key, metric_name in getattr(self, "rule_metrics", {}).items():
            if not isinstance(metric_name, str) or not metric_name:
                result[key + "_metric_query"] = {"status": "metric_name_missing"}
        return result

    def logs(self):
        groups = getattr(self, "log_groups", set())
        if not groups:
            raise InspectionError("log_group_not_discovered")
        summaries = []
        for group in sorted(groups):
            data = self.aws.get(
                "logs",
                "describe-log-groups",
                "--log-group-name-prefix",
                group,
                "--no-paginate",
            )
            matches = [
                g for g in data.get("logGroups", []) if g.get("logGroupName") == group
            ]
            if len(matches) != 1:
                raise InspectionError("log_group_not_found")
            filters = self.aws.get(
                "logs",
                "describe-subscription-filters",
                "--log-group-name",
                group,
                "--no-paginate",
            )
            if filters.get("nextToken"):
                raise InspectionError("log_subscriptions_truncated")
            summaries.append(
                {
                    "retention_days": number(matches[0].get("retentionInDays")),
                    "subscription_filter_count": len(
                        filters.get("subscriptionFilters", [])
                    ),
                }
            )
        return {"groups": summaries, "log_contents_inspected": False}

    def run(self):
        identity = self.check(
            "account_guard",
            lambda: {
                "expected_account": self.aws.get("sts", "get-caller-identity").get(
                    "Account"
                )
                == ACCOUNT
            },
        )
        if not identity or not identity["expected_account"]:
            return self.results
        for name in (
            "service",
            "tasks",
            "waf",
            "dashboard",
            "alarms",
            "subscriptions",
            "metrics",
            "logs",
        ):
            self.check(name, getattr(self, name))
        return self.results


def main():
    inspector = Inspector(Aws())
    results = inspector.run()
    # Only fixed labels, numbers, booleans and allowlisted strings enter the report.
    report = {
        "environment": "infra-dev",
        "observations": results,
        "limitations": [
            "Configuration snapshot only; not a public-release approval.",
            "No uploads, WAF changes, notifications or task commands were executed.",
            "No raw logs, environment dumps, secret references or recipient addresses are included.",
            "No datapoints does not establish zero traffic or working monitoring.",
            "Task-definition tmpfs is a declaration, not proof of effective mounts or cleanup.",
            "Database-stored feature flags, actual cleanup and notification delivery were not inspected.",
        ],
    }
    rows = ["| Check | Result |", "| --- | --- |"]
    for result in results:
        rows.append(f"| {result['check'].replace('_', ' ')} | {result['status']} |")
    summary = (
        "# Readability Calculator — infra-dev inspection\n\n"
        "Observed means the read completed, not that the control is effective. "
        "Review settings below; missing data is not proof of zero traffic.\n\n"
        + "\n".join(rows)
        + "\n\n<details><summary>Selected settings and limitations</summary>\n\n```json\n"
        + json.dumps(report, indent=2, allow_nan=False)
        + "\n```\n\n</details>\n"
    )
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as stream:
            stream.write(summary)
    return (
        0
        if len(results) == 9
        and all(r["status"] == "observed" for r in results)
        and results[0]["details"]["expected_account"]
        else 1
    )


if __name__ == "__main__":
    raise SystemExit(main())
