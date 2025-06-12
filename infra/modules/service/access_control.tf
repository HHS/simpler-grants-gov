#----------------
# Access Control
#----------------

resource "aws_iam_role" "task_executor" {
  name               = local.task_executor_role_name
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role_policy.json
}

resource "aws_iam_role" "app_service" {
  name               = "${var.service_name}-app"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role_policy.json
}

resource "aws_iam_role" "migrator_task" {
  count = var.db_vars != null ? 1 : 0

  name               = "${var.service_name}-migrator"
  assume_role_policy = data.aws_iam_policy_document.ecs_tasks_assume_role_policy.json
}

data "aws_iam_policy_document" "ecs_tasks_assume_role_policy" {
  statement {
    sid = "ECSTasksAssumeRole"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "task_executor" {
  # Allow ECS to log to Cloudwatch.
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "${aws_cloudwatch_log_group.service_logs.arn}:*",
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:service/${var.service_name}*"
    ]
  }

  # Allow ECS to authenticate with ECR
  statement {
    sid = "ECRAuth"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.image_repository_arn != null ? [1] : []
    content {
      sid = "ECRPullAccess"
      actions = [
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer",
      ]
      resources = [var.image_repository_arn]
    }
  }

  # Allow ECS to download images for fluentbit
  statement {
    sid = "ECRPullAccessFluentbit"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [local.fluent_bit_repo_arn]
  }

  statement {
    sid = "PullSharedNewRelicKey"
    actions = [
      "ssm:GetParameters"
    ]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/new-relic-license-key"
    ]
  }

  dynamic "statement" {
    for_each = length(var.secrets) > 0 ? [1] : []
    content {
      sid       = "SecretsAccess"
      actions   = ["ssm:GetParameters"]
      resources = [for secret in var.secrets : secret.valueFrom]
    }
  }
}

data "aws_iam_policy_document" "runtime_logs" {
  # Allow fluentbit to create logs group / push logs to Cloudwatch at runtime.
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = [
      "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:service/${var.service_name}*"
    ]
  }
}

data "aws_iam_policy_document" "email_access" {
  dynamic "statement" {
    for_each = length(var.pinpoint_app_id) > 0 ? [1] : []
    content {
      sid       = "SendViaPinpoint"
      actions   = ["mobiletargeting:SendMessages"]
      resources = ["arn:aws:mobiletargeting:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:apps/${var.pinpoint_app_id}/messages"]
    }
  }

  dynamic "statement" {
    for_each = length(var.pinpoint_app_id) > 0 ? [1] : []
    content {
      sid       = "SendSESEmail"
      actions   = ["ses:SendEmail"]
      resources = ["arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/${var.domain_name}"]
    }
  }
}

resource "aws_iam_role_policy" "task_executor" {
  name   = "${var.service_name}-task-executor-role-policy"
  role   = aws_iam_role.task_executor.id
  policy = data.aws_iam_policy_document.task_executor.json
}

resource "aws_iam_policy" "runtime_logs" {
  name   = "${var.service_name}-task-executor-role-policy"
  policy = data.aws_iam_policy_document.runtime_logs.json
}

resource "aws_iam_policy" "email_access" {
  name   = "${var.service_name}-email-access-role-policy"
  policy = data.aws_iam_policy_document.email_access.json
}

resource "aws_iam_role_policy_attachment" "extra_policies" {
  for_each = var.extra_policies

  role       = aws_iam_role.app_service.name
  policy_arn = each.value
}

resource "aws_iam_role_policy_attachment" "runtime_logs" {
  role       = aws_iam_role.app_service.name
  policy_arn = aws_iam_policy.runtime_logs.arn
}

resource "aws_iam_role_policy_attachment" "email_access" {
  role       = aws_iam_role.app_service.name
  policy_arn = aws_iam_policy.email_access.arn
}
