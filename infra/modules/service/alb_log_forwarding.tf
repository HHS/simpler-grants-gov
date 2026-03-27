#--------------------------------------------
# Forward ALB access logs from S3 to New Relic
#--------------------------------------------

locals {
  nr_alb_log_forwarder_name = "${var.service_name}-nr-alb-log-forwarder"
}

data "aws_ssm_parameter" "newrelic_license_key" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "/new-relic-license-key"
}

data "archive_file" "nr_alb_log_forwarder" {
  count       = var.enable_load_balancer ? 1 : 0
  type        = "zip"
  output_path = "${path.module}/lambda/newrelic_alb_log_forwarder.zip"

  source {
    filename = "index.py"
    content  = file("${path.module}/lambda/newrelic_alb_log_forwarder.py")
  }
}

resource "aws_lambda_function" "nr_alb_log_forwarder" {
  # checkov:skip=CKV_AWS_116:DLQ not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_117:VPC access not required for log forwarding
  # checkov:skip=CKV_AWS_173:Env vars contain no secrets — license key is fetched from SSM at runtime
  # checkov:skip=CKV_AWS_272:Code signing not required for infrastructure Lambda
  # checkov:skip=CKV_AWS_115:Reserved concurrency not needed for log forwarding Lambda
  # checkov:skip=CKV_AWS_50:X-Ray tracing not required for log forwarding Lambda

  count = var.enable_load_balancer ? 1 : 0

  function_name = local.nr_alb_log_forwarder_name
  description   = "Forwards ALB access logs from S3 to New Relic"
  runtime       = "python3.12"
  handler       = "index.handler"
  timeout       = 60
  memory_size   = 256

  role = aws_iam_role.nr_alb_log_forwarder[0].arn

  filename         = data.archive_file.nr_alb_log_forwarder[0].output_path
  source_code_hash = data.archive_file.nr_alb_log_forwarder[0].output_base64sha256

  environment {
    variables = {
      NR_LICENSE_KEY_SSM_PATH = data.aws_ssm_parameter.newrelic_license_key[0].name
      NR_LOGS_ENDPOINT        = "https://log-api.newrelic.com/log/v1"
      AWS_ACCOUNT_ID          = data.aws_caller_identity.current.account_id
      ALB_NAME                = var.service_name
      MTLS_ALB_NAME           = "${var.service_name}-mtls"
      NR_ENTITY_GUID          = coalesce(var.newrelic_entity_guid, "")
      NR_MTLS_ENTITY_GUID     = coalesce(var.newrelic_mtls_entity_guid, "")
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.nr_alb_log_forwarder,
  ]
}

resource "aws_kms_key" "nr_alb_log_forwarder" {
  count               = var.enable_load_balancer ? 1 : 0
  description         = "Key for Lambda function ${local.nr_alb_log_forwarder_name}"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${local.nr_alb_log_forwarder_name}"
          }
        }
      },
    ]
  })
}

resource "aws_cloudwatch_log_group" "nr_alb_log_forwarder" {
  # checkov:skip=CKV_AWS_338:Forwarding Lambda logs don't need long retention — actual ALB logs are in New Relic
  count             = var.enable_load_balancer ? 1 : 0
  name              = "/aws/lambda/${local.nr_alb_log_forwarder_name}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.nr_alb_log_forwarder[0].arn
}

# --- IAM ---

resource "aws_iam_role" "nr_alb_log_forwarder" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${local.nr_alb_log_forwarder_name}-role"

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

resource "aws_iam_role_policy_attachment" "nr_alb_log_forwarder_basic" {
  count      = var.enable_load_balancer ? 1 : 0
  role       = aws_iam_role.nr_alb_log_forwarder[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "nr_alb_log_forwarder_ssm" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${local.nr_alb_log_forwarder_name}-ssm"
  role  = aws_iam_role.nr_alb_log_forwarder[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "ssm:GetParameter"
      Resource = data.aws_ssm_parameter.newrelic_license_key[0].arn
    }]
  })
}

resource "aws_iam_role_policy" "nr_alb_log_forwarder_s3" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${local.nr_alb_log_forwarder_name}-s3"
  role  = aws_iam_role.nr_alb_log_forwarder[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.access_logs.arn}/*"
    }]
  })
}

# --- S3 event notification ---

resource "aws_lambda_permission" "allow_s3_alb_logs" {
  count         = var.enable_load_balancer ? 1 : 0
  statement_id  = "AllowS3AlbLogs"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.nr_alb_log_forwarder[0].function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.access_logs.arn
}

resource "aws_s3_bucket_notification" "alb_logs_to_lambda" {
  count  = var.enable_load_balancer ? 1 : 0
  bucket = aws_s3_bucket.access_logs.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.nr_alb_log_forwarder[0].arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "${var.service_name}-lb/"
    filter_suffix       = ".log.gz"
  }

  depends_on = [aws_lambda_permission.allow_s3_alb_logs]
}
