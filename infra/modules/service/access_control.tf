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

# OpenSearch write role for scheduled jobs that need to write to OpenSearch
# This role is separate from the migrator role which is now only used for database migrations
resource "aws_iam_role" "opensearch_write" {
  count = var.opensearch_ingest_policy_arn != null ? 1 : 0

  name               = "${var.service_name}-opensearch-write"
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
  # Allow ECS to log to CloudWatch.
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

  # Allow ECS to download images for GuardDuty agent
  statement {
    sid = "ECRPullAccessGuardDuty"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = ["arn:aws:ecr:us-east-1:593207742271:repository/aws-guardduty-agent-fargate"]
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
  count = length(var.pinpoint_app_id) > 0 ? 1 : 0

  statement {
    sid       = "SendViaPinpoint"
    actions   = ["mobiletargeting:SendMessages"]
    resources = ["arn:aws:mobiletargeting:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:apps/${var.pinpoint_app_id}/messages"]
  }
  statement {
    sid       = "SendSESEmail"
    actions   = ["ses:SendEmail"]
    resources = ["arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/${var.hosted_zone}"]
  }
  statement {
    sid       = "SendSESEmailConfigurationSet"
    actions   = ["ses:SendEmail"]
    resources = ["arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:configuration-set/${var.ses_configuration_set}"]
  }
  statement {
    sid       = "ListSuppressedDestinations"
    actions   = ["ses:ListSuppressedDestinations"]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "api_gateway_access" {
  count = var.enable_api_gateway ? 1 : 0

  # Only allows running the GET /apikeys request
  statement {
    sid     = "AllowGetApiKeys"
    actions = ["apigateway:GET"]
    resources = [
      # Must be wildcarded for this to work. Someone using a dev key in prod would not work
      # because the dev key's usage plan doesn't allow it to access other env's gateways
      "arn:aws:apigateway:${data.aws_region.current.name}::/apikeys/*", # GetApiKey
    ]
  }

  # Only allows running the POST /apikeys request
  statement {
    sid     = "AllowImportApiKeys"
    actions = ["apigateway:POST"]
    resources = [
      # Must be wildcarded for this to work. Someone using a dev key in prod would not work
      # because the dev key's usage plan doesn't allow it to access other env's gateways
      "arn:aws:apigateway:${data.aws_region.current.name}::/apikeys", # ImportApiKeys
    ]
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

resource "aws_iam_policy" "api_gateway_access" {
  count  = var.enable_api_gateway ? 1 : 0
  name   = "${var.service_name}-api-gateway-access-role-policy"
  policy = data.aws_iam_policy_document.api_gateway_access[0].json
}

resource "aws_iam_policy" "email_access" {
  count  = length(var.pinpoint_app_id) > 0 ? 1 : 0
  name   = "${var.service_name}-email-access-role-policy"
  policy = data.aws_iam_policy_document.email_access[0].json
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
  count = length(var.pinpoint_app_id) > 0 ? 1 : 0

  role       = aws_iam_role.app_service.name
  policy_arn = aws_iam_policy.email_access[0].arn
}

resource "aws_iam_role_policy_attachment" "migrator_email_access" {
  count = length(var.pinpoint_app_id) > 0 && var.db_vars != null ? 1 : 0

  role       = aws_iam_role.migrator_task[0].name
  policy_arn = aws_iam_policy.email_access[0].arn
}

resource "aws_iam_role_policy_attachment" "api_gateway_access" {
  count = var.enable_api_gateway ? 1 : 0

  role       = aws_iam_role.app_service.name
  policy_arn = aws_iam_policy.api_gateway_access[0].arn
}
