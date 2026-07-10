#--------------------------------------------
# Forward OpenSearch CloudWatch logs to New Relic
#--------------------------------------------

locals {
  nr_log_forwarder_name = "${var.service_name}-nr-log-forwarder"
}

data "aws_ssm_parameter" "newrelic_license_key" {
  name = "/new-relic-license-key"
}

data "archive_file" "nr_log_forwarder" {
  type        = "zip"
  output_path = "${path.module}/lambda/newrelic_log_forwarder.zip"

  source {
    filename = "index.py"
    content  = file("${path.module}/lambda/newrelic_log_forwarder.py")
  }
}

resource "aws_lambda_function" "nr_log_forwarder" {
  # checkov:skip=CKV_AWS_116:DLQ not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_117:VPC access not required for log forwarding
  # checkov:skip=CKV_AWS_173:Env vars contain no secrets — license key is fetched from SSM at runtime
  # checkov:skip=CKV_AWS_272:Code signing not required for infrastructure Lambda
  # checkov:skip=CKV_AWS_115:Reserved concurrency not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_50:X-Ray tracing not required for log forwarding Lambda

  function_name = local.nr_log_forwarder_name
  description   = "Forwards OpenSearch CloudWatch logs to New Relic"
  runtime       = "python3.12"
  handler       = "index.handler"
  timeout       = 30
  memory_size   = 128

  role = aws_iam_role.nr_log_forwarder.arn

  filename         = data.archive_file.nr_log_forwarder.output_path
  source_code_hash = data.archive_file.nr_log_forwarder.output_base64sha256

  environment {
    variables = {
      NR_LICENSE_KEY_SSM_PATH = data.aws_ssm_parameter.newrelic_license_key.name
      NR_LOGS_ENDPOINT        = "https://log-api.newrelic.com/log/v1"
      AWS_ACCOUNT_ID          = data.aws_caller_identity.current.account_id
      OPENSEARCH_DOMAIN_NAME  = aws_opensearch_domain.opensearch.domain_name
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.nr_log_forwarder,
  ]
}

resource "aws_cloudwatch_log_group" "nr_log_forwarder" {
  # checkov:skip=CKV_AWS_338:Forwarding Lambda logs don't need long retention — actual OpenSearch logs are in New Relic
  name              = "/aws/lambda/${local.nr_log_forwarder_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.opensearch.arn
}

# --- IAM ---

resource "aws_iam_role" "nr_log_forwarder" {
  name = "${local.nr_log_forwarder_name}-role"

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

resource "aws_iam_role_policy_attachment" "nr_log_forwarder_basic" {
  role       = aws_iam_role.nr_log_forwarder.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "nr_log_forwarder_ssm" {
  name = "${local.nr_log_forwarder_name}-ssm"
  role = aws_iam_role.nr_log_forwarder.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = data.aws_ssm_parameter.newrelic_license_key.arn
    }]
  })
}

# --- CloudWatch Logs subscription ---

resource "aws_lambda_permission" "allow_cloudwatch_opensearch" {
  statement_id  = "AllowCloudWatchOpenSearch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nr_log_forwarder.function_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.opensearch.arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "opensearch_to_newrelic" {
  name            = "${var.service_name}-opensearch-to-newrelic"
  log_group_name  = aws_cloudwatch_log_group.opensearch.name
  filter_pattern  = ""
  destination_arn = aws_lambda_function.nr_log_forwarder.arn

  depends_on = [aws_lambda_permission.allow_cloudwatch_opensearch]
}
