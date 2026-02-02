#--------------------------------------------
# This configures internal OpenSearch role mappings
#--------------------------------------------

locals {
  role_mappings_lambda_name = "${var.service_name}-opensearch-role-mappings"
}

resource "aws_lambda_function" "role_mappings" {
  # checkov:skip=CKV_AWS_116:DLQ not needed for one-time configuration Lambda
  # checkov:skip=CKV_AWS_117:VPC configuration is set below
  # checkov:skip=CKV_AWS_173:Environment variables contain non-sensitive config only
  # checkov:skip=CKV_AWS_272:Code signing not required for infrastructure Lambda
  # checkov:skip=CKV_AWS_115:Reserved concurrency not needed for one-time Lambda
  # checkov:skip=CKV_AWS_50:X-Ray tracing not required for configuration Lambda

  function_name = local.role_mappings_lambda_name
  description   = "Configures OpenSearch FGAC role mappings for IAM authentication"
  runtime       = "python3.12"
  handler       = "index.handler"
  timeout       = 60
  memory_size   = 128

  role = aws_iam_role.role_mappings_lambda.arn

  filename         = data.archive_file.role_mappings_lambda.output_path
  source_code_hash = data.archive_file.role_mappings_lambda.output_base64sha256

  vpc_config {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.role_mappings_lambda.id]
  }

  environment {
    variables = {
      OPENSEARCH_ENDPOINT = aws_opensearch_domain.opensearch.endpoint
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.role_mappings_lambda_vpc,
    aws_cloudwatch_log_group.role_mappings_lambda,
  ]
}

data "archive_file" "role_mappings_lambda" {
  type        = "zip"
  output_path = "${path.module}/lambda/role_mappings.zip"

  source {
    filename = "index.py"
    content  = file("${path.module}/lambda/role_mappings.py")
  }
}

resource "aws_cloudwatch_log_group" "role_mappings_lambda" {
  name              = "/aws/lambda/${local.role_mappings_lambda_name}"
  retention_in_days = 1827 # 5 years, matching other log groups in codebase
  kms_key_id        = aws_kms_key.opensearch.arn
}

resource "aws_security_group" "role_mappings_lambda" {
  name        = "${local.role_mappings_lambda_name}-sg"
  description = "Security group for OpenSearch role mappings Lambda"
  vpc_id      = var.vpc_id

  egress {
    description     = "Allow HTTPS to OpenSearch"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.opensearch.id]
  }

  tags = {
    Name = "${local.role_mappings_lambda_name}-sg"
  }
}

resource "aws_security_group_rule" "opensearch_from_lambda" {
  type                     = "ingress"
  description              = "Allow HTTPS from role mappings Lambda"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.role_mappings_lambda.id
  security_group_id        = aws_security_group.opensearch.id
}

resource "aws_iam_role" "role_mappings_lambda" {
  name = "${local.role_mappings_lambda_name}-role"

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

resource "aws_iam_role_policy_attachment" "role_mappings_lambda_vpc" {
  role       = aws_iam_role.role_mappings_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "role_mappings_lambda_logs" {
  name = "${local.role_mappings_lambda_name}-logs"
  role = aws_iam_role.role_mappings_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.role_mappings_lambda.arn}:*"
      }
    ]
  })
}

resource "aws_lambda_invocation" "configure_role_mappings" {
  function_name = aws_lambda_function.role_mappings.function_name

  input = jsonencode({
    username           = random_password.opensearch_username.result
    password           = random_password.opensearch_password.result
    ingest_role_arn    = local.ingest_role_arn
    query_role_arn     = local.query_role_arn
    sso_admin_role_arn = var.sso_admin_role_arn
  })

  depends_on = [
    aws_opensearch_domain.opensearch,
    aws_opensearch_domain_policy.main,
  ]

  triggers = {
    ingest_role_arn  = local.ingest_role_arn
    query_role_arn   = local.query_role_arn
    lambda_code_hash = data.archive_file.role_mappings_lambda.output_base64sha256
    domain_policy    = aws_opensearch_domain_policy.main.id
  }
}

output "role_mappings_result" {
  description = "Result of the OpenSearch role mappings configuration"
  value       = jsondecode(aws_lambda_invocation.configure_role_mappings.result)
  sensitive   = true
}
