#------------
# Events Role
#------------
# Role and policy used by AWS EventBridge to trigger jobs from events

# Role that EventBridge will assume
# The role allows EventBridge to run tasks on the ECS cluster
resource "aws_iam_role" "events" {
  name               = "${local.cluster_name}-events"
  assume_role_policy = data.aws_iam_policy_document.events_assume_role.json
}

resource "aws_iam_role_policy_attachment" "events" {
  role       = aws_iam_role.events.name
  policy_arn = aws_iam_policy.run_task.arn
}

data "aws_iam_policy_document" "events_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

# Policy that allows running tasks on the ECS cluster
resource "aws_iam_policy" "run_task" {
  name   = "${var.service_name}-run-access"
  policy = data.aws_iam_policy_document.run_task.json
}

data "aws_iam_policy_document" "run_task" {

  statement {
    sid = "StepFunctionsEvents"
    actions = [
      "events:PutTargets",
      "events:PutRule",
      "events:DescribeRule",
    ]
    resources = ["arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForStepFunctionsExecutionRule"]
  }

  dynamic "statement" {
    for_each = aws_sfn_state_machine.file_upload_jobs

    content {
      actions = [
        "states:StartExecution",
      ]
      resources = [statement.value.arn]
    }
  }

  dynamic "statement" {
    for_each = aws_sfn_state_machine.file_upload_jobs

    content {
      actions = [
        "states:DescribeExecution",
        "states:StopExecution",
      ]
      resources = ["${statement.value.arn}:*"]
    }
  }
}
