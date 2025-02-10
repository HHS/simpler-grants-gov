#---------------------
# Task Scheduler Role
#---------------------
# Role and policy used by AWS EventBridge to trigger jobs from events
#

# Role that EventBridge will assume
# The role allows EventBridge to run tasks on the ECS cluster
resource "aws_iam_role" "events" {
  name                = "${local.cluster_name}-events"
  managed_policy_arns = [aws_iam_policy.run_task.arn]
  assume_role_policy  = data.aws_iam_policy_document.events_assume_role.json
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
    effect    = "Allow"
    actions   = ["ecs:RunTask"]
    resources = ["${aws_ecs_task_definition.app.arn_without_revision}:*"]
    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.cluster.arn]
    }
  }

  statement {
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.task_executor.arn,
      aws_iam_role.app_service.arn,
    ]
    condition {
      test     = "StringLike"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com"]
    }
  }
}
