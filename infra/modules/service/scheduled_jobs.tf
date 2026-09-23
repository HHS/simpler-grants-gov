resource "aws_scheduler_schedule" "scheduled_jobs" {
  for_each = var.scheduled_jobs

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_297:Encrypt with customer key in future work

  depends_on = [aws_iam_role_policy_attachment.scheduler]

  name                         = "${var.service_name}-${each.key}"
  state                        = each.value.state
  schedule_expression          = each.value.schedule_expression
  schedule_expression_timezone = "Etc/UTC"

  flexible_time_window {
    mode = "OFF"
  }

  # target is the state machine
  target {
    arn      = aws_sfn_state_machine.scheduled_jobs[each.key].arn
    role_arn = aws_iam_role.scheduler.arn

    retry_policy {
      maximum_retry_attempts = 0
    }
  }
}

locals {
  # Map role_override values to actual role ARNs
  # null or unspecified = app_service role (default)
  # "opensearch-write" = opensearch_write role (for OpenSearch sync jobs)
  # "migrator" = migrator_task role (for database migration jobs during CI/CD)
  scheduled_job_role_arns = {
    for job_name, job_config in var.scheduled_jobs : job_name => (
      job_config.role_override == "opensearch-write" ? aws_iam_role.opensearch_write[0].arn :
      job_config.role_override == "migrator" ? aws_iam_role.migrator_task[0].arn :
      aws_iam_role.app_service.arn
    )
  }

  # Fargate occasionally has no capacity in the availability zone ECS selects,
  # which surfaces as ECS.AmazonECSException before the container starts. AWS
  # labels these retriable ("Please try again later or in a different
  # availability zone"), and because no application code has run yet there is
  # nothing to undo, so retrying is safe regardless of whether the job itself
  # is idempotent.
  #
  # Only that error is retried. Two exclusions are deliberate:
  #
  #   - States.TaskFailed is raised when the container exits non-zero, meaning
  #     the job's own logic failed. Retrying re-runs a broken job and delays
  #     the alert.
  #   - ECS.ServerException can be raised by the .sync integration while
  #     polling DescribeTasks, which is after RunTask already launched the
  #     task. Retrying then starts a second copy of a job that may already be
  #     writing, which is the same double-write hazard as States.TaskFailed.
  #
  # MaxDelaySeconds caps the backoff so a retried job cannot drift into the
  # next run of an hourly schedule.
  ecs_run_task_retry = [
    {
      "ErrorEquals" : ["ECS.AmazonECSException"],
      "IntervalSeconds" : 60,
      "MaxAttempts" : 3,
      "BackoffRate" : 2.0,
      "MaxDelaySeconds" : 120,
      "JitterStrategy" : "FULL"
    }
  ]

  ecs_run_task_catch = [
    {
      "ErrorEquals" : ["States.ALL"],
      "ResultPath" : "$.error",
      "Next" : "JobFailed"
    }
  ]

  # The caught error is passed to States.Format as arguments rather than
  # interpolated into the template, so a quote or brace in the underlying
  # cause cannot break the intrinsic. Job identity is safe to interpolate:
  # it comes from config and is constrained to names and dashes.
  job_failed_cause_suffix = "Underlying error: {} - {}', $.error.Error, $.error.Cause)"
}

resource "aws_sfn_state_machine" "scheduled_jobs" {
  for_each = var.scheduled_jobs

  depends_on = [aws_iam_role_policy_attachment.workflow_orchestrator]

  name     = "${var.service_name}-${each.key}"
  role_arn = aws_iam_role.workflow_orchestrator.arn

  # Always use the app task definition. Role overrides are handled via TaskRoleArn in Overrides.
  # - Default (no role_override): uses app_service role
  # - role_override = "opensearch-write": uses opensearch_write role (for OpenSearch sync jobs)
  # - role_override = "migrator": uses migrator_task role (for database migrations during CI/CD)
  definition = jsonencode({
    "StartAt" : "RunTask",
    "States" : {
      "RunTask" : {
        "Type" : "Task",
        # docs: https://docs.aws.amazon.com/step-functions/latest/dg/connect-ecs.html
        "Resource" : "arn:aws:states:::ecs:runTask.sync",
        "Parameters" : {
          "Cluster" : aws_ecs_cluster.cluster.arn,
          "TaskDefinition" : aws_ecs_task_definition.app.arn_without_revision,
          "LaunchType" : "FARGATE",
          "NetworkConfiguration" : {
            "AwsvpcConfiguration" : {
              "Subnets" : module.network.private_subnet_ids,
              "SecurityGroups" : [aws_security_group.app.id],
            }
          },
          "Overrides" : {
            "Cpu" : tostring(each.value.cpu),
            "Memory" : tostring(each.value.mem),
            "TaskRoleArn" : local.scheduled_job_role_arns[each.key],
            "ContainerOverrides" : [
              {
                "Name" : var.service_name,
                "Command" : each.value.task_command,
                "Cpu" : each.value.cpu - 256,
                "Memory" : each.value.mem - 256,
                "Environment" : each.value.environment_vars
              }
            ]
          }
        },
        "Retry" : local.ecs_run_task_retry,
        "Catch" : local.ecs_run_task_catch,
        "End" : true
      },
      # Terminal failure state. Its only purpose is to put the job identity and
      # the underlying ECS error into the execution's failure Cause, so the
      # alert names what went wrong instead of requiring someone to pull the
      # execution history by hand.
      "JobFailed" : {
        "Type" : "Fail",
        "Error" : "ScheduledJobFailed",
        # The job identity is baked into the template (it comes from config and
        # contains no quotes), but the caught error is passed as arguments so a
        # quote or brace in the underlying cause cannot break the intrinsic.
        # The command is intentionally not included: it can contain characters
        # that are unsafe to interpolate into an ASL single-quoted literal, and
        # it is already visible in the execution input.
        "CausePath" : "States.Format('Scheduled job ${each.key} (${var.service_name}) failed in ${var.environment_name}. ${local.job_failed_cause_suffix}"
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.scheduled_jobs[each.key].arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }

  tags = {
    job  = each.key
    name = "${var.service_name}-${each.key}"
  }
}

resource "aws_cloudwatch_log_group" "scheduled_jobs" {
  for_each = var.scheduled_jobs

  name_prefix = "/aws/vendedlogs/states/${var.service_name}-${each.key}/scheduled-jobs/"

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}
