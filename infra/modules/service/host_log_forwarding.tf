#--------------------------------------------
# Forward ECS application CloudWatch logs to New Relic
#--------------------------------------------

locals {
  nr_host_log_forwarder_name = "${var.service_name}-nr-host-log-forwarder"
}

data "aws_ssm_parameter" "newrelic_license_key_host" {
  name = "/new-relic-license-key"
}

data "archive_file" "nr_host_log_forwarder" {
  type        = "zip"
  output_path = "${path.module}/lambda/newrelic_host_log_forwarder.zip"

  source {
    filename = "index.py"
    content  = file("${path.module}/lambda/newrelic_host_log_forwarder.py")
  }
}

resource "aws_lambda_function" "nr_host_log_forwarder" {
  # checkov:skip=CKV_AWS_116:DLQ not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_117:VPC access not required for log forwarding
  # checkov:skip=CKV_AWS_173:Env vars contain no secrets — license key is fetched from SSM at runtime
  # checkov:skip=CKV_AWS_272:Code signing not required for infrastructure Lambda
  # checkov:skip=CKV_AWS_115:Reserved concurrency not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_50:X-Ray tracing not required for log forwarding Lambda

  function_name = local.nr_host_log_forwarder_name
  description   = "Forwards ECS application CloudWatch logs to New Relic"
  runtime       = "python3.12"
  handler       = "index.handler"
  timeout       = 30
  memory_size   = 128

  role = aws_iam_role.nr_host_log_forwarder.arn

  filename         = data.archive_file.nr_host_log_forwarder.output_path
  source_code_hash = data.archive_file.nr_host_log_forwarder.output_base64sha256

  environment {
    variables = {
      NR_LICENSE_KEY_SSM_PATH = data.aws_ssm_parameter.newrelic_license_key_host.name
      NR_LOGS_ENDPOINT        = "https://log-api.newrelic.com/log/v1"
      AWS_ACCOUNT_ID          = data.aws_caller_identity.current.account_id
      ECS_SERVICE_NAME        = var.service_name
      ECS_CLUSTER_NAME        = var.service_name
      NR_ENTITY_GUID          = var.newrelic_host_entity_guid != null ? var.newrelic_host_entity_guid : ""
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.nr_host_log_forwarder,
  ]
}

resource "aws_kms_key" "nr_host_log_forwarder" {
  description         = "Key for Lambda function ${local.nr_host_log_forwarder_name}"
  enable_key_rotation = true
  # checkov:skip=CKV2_AWS_64:Key policy grants CloudWatch Logs access below

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableRootAccountAccess"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowCloudWatchLogs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey",
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.nr_host_log_forwarder_name}"
          }
        }
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "nr_host_log_forwarder" {
  # checkov:skip=CKV_AWS_338:Forwarding Lambda logs don't need long retention — actual ECS logs are in New Relic
  name              = "/aws/lambda/${local.nr_host_log_forwarder_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.nr_host_log_forwarder.arn
}

# --- IAM ---

resource "aws_iam_role" "nr_host_log_forwarder" {
  name = "${local.nr_host_log_forwarder_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "nr_host_log_forwarder_basic" {
  role       = aws_iam_role.nr_host_log_forwarder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "nr_host_log_forwarder_ssm" {
  name = "${local.nr_host_log_forwarder_name}-ssm"
  role = aws_iam_role.nr_host_log_forwarder.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = data.aws_ssm_parameter.newrelic_license_key_host.arn
    }]
  })
}

# --- CloudWatch Logs subscription ---

resource "aws_lambda_permission" "allow_cloudwatch_host" {
  statement_id  = "AllowCloudWatchHost"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nr_host_log_forwarder.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.service_logs.arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "host_to_newrelic" {
  name            = "${var.service_name}-host-to-newrelic"
  log_group_name  = aws_cloudwatch_log_group.service_logs.name
  filter_pattern  = ""
  destination_arn = aws_lambda_function.nr_host_log_forwarder.arn

  depends_on = [aws_lambda_permission.allow_cloudwatch_host]
}
