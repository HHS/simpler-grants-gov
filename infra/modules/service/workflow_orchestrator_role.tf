#--------------------------------
# Scheduler Workflow Manager Role
#--------------------------------
# This role and policy are used by the Step Functions state machine that manages the scheduled jobs workflow.

resource "aws_iam_role" "workflow_orchestrator" {
  name               = "${var.service_name}-workflow-orchestrator"
  assume_role_policy = data.aws_iam_policy_document.workflow_orchestrator_assume_role.json
}

resource "aws_iam_role_policy_attachment" "workflow_orchestrator" {
  role       = aws_iam_role.workflow_orchestrator.name
  policy_arn = aws_iam_policy.workflow_orchestrator.arn
}

data "aws_iam_policy_document" "workflow_orchestrator_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["states.amazonaws.com"]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:states:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:stateMachine:*"]
    }

    condition {
      test     = "StringLike"
      variable = "aws:SourceAccount"
      values = [
        data.aws_caller_identity.current.account_id
      ]
    }
  }
}

resource "aws_iam_policy" "workflow_orchestrator" {
  name   = "${var.service_name}-workflow-orchestrator"
  policy = data.aws_iam_policy_document.workflow_orchestrator.json
}

#tfsec:ignore:aws-iam-no-policy-wildcards
data "aws_iam_policy_document" "workflow_orchestrator" {
  # checkov:skip=CKV_AWS_111:These permissions are scoped just fine

  statement {
    sid = "UnscopeLogsPermissions"
    actions = [
      "logs:CreateLogDelivery",
      "logs:CreateLogStream",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutLogEvents",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
      "logs:DescribeLogGroups",
    ]
    resources = ["*"]
  }

  statement {
    sid = "StepFunctionsEvents"
    actions = [
      "events:PutTargets",
      "events:PutRule",
      "events:DescribeRule",
    ]
    resources = [
      "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:rule/StepFunctionsGetEventsForECSTaskRule",
    ]
  }

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
    effect = "Allow"
    actions = [
      "ecs:StopTask",
      "ecs:DescribeTasks",
    ]
    resources = ["arn:aws:ecs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:task/${var.service_name}/*"]
    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [aws_ecs_cluster.cluster.arn]
    }
  }


  statement {
    sid = "PassRole"
    actions = [
      "iam:PassRole",
    ]
    resources = [
      aws_iam_role.task_executor.arn,
      aws_iam_role.app_service.arn,
    ]
  }
}
