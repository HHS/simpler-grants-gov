# Role Manager Lambda Function
# ----------------------------
#
# Resources for the lambda function that is used for managing database roles
# This includes creating and granting permissions to roles
# as well as viewing existing roles

resource "aws_lambda_function" "role_manager" {
  function_name = local.role_manager_name

  filename         = local.role_manager_package
  source_code_hash = data.archive_file.role_manager.output_base64sha256
  runtime          = "python3.9"
  handler          = "role_manager.lambda_handler"
  role             = aws_iam_role.role_manager.arn
  kms_key_arn      = aws_kms_key.role_manager.arn

  # Only allow 1 concurrent execution at a time
  reserved_concurrent_executions = 1

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.role_manager.id]
  }

  environment {
    variables = {
      DB_HOST                = aws_rds_cluster.db.endpoint
      DB_PORT                = aws_rds_cluster.db.port
      DB_USER                = local.master_username
      DB_NAME                = aws_rds_cluster.db.database_name
      DB_PASSWORD_PARAM_NAME = aws_ssm_parameter.random_db_password.name
      DB_SCHEMA              = var.schema_name
      APP_USER               = var.app_username
      MIGRATOR_USER          = var.migrator_username
      PYTHONPATH             = "vendor"
    }
  }

  # Ensure AWS Lambda functions with tracing are enabled
  # https://docs.bridgecrew.io/docs/bc_aws_serverless_4
  tracing_config {
    mode = "Active"
  }

  # checkov:skip=CKV_AWS_272:TODO(https://github.com/navapbc/template-infra/issues/283)

  # checkov:skip=CKV_AWS_116:Dead letter queue (DLQ) configuration is only relevant for asynchronous invocations
}

# Installs python packages needed by the role manager lambda function before
# creating the zip archive. Reinstalls whenever requirements.txt changes
resource "terraform_data" "role_manager_python_vendor_packages" {
  triggers_replace = file("${path.module}/role_manager/requirements.txt")

  provisioner "local-exec" {
    command = "pip3 install -r ${path.module}/role_manager/requirements.txt -t ${path.module}/role_manager/vendor"
  }
}

data "archive_file" "role_manager" {
  type        = "zip"
  source_dir  = "${path.module}/role_manager"
  output_path = local.role_manager_package
  depends_on  = [terraform_data.role_manager_python_vendor_packages]
}

data "aws_kms_key" "default_ssm_key" {
  key_id = "alias/aws/ssm"
}

# KMS key used to encrypt role manager's environment variables
resource "aws_kms_key" "role_manager" {
  description         = "Key for Lambda function ${local.role_manager_name}"
  enable_key_rotation = true
}

# IAM for Role Manager lambda function
resource "aws_iam_role" "role_manager" {
  name               = "${var.name}-manager"
  assume_role_policy = data.aws_iam_policy_document.role_manager_assume_role.json
  managed_policy_arns = [
    data.aws_iam_policy.lambda_vpc_access.arn,

    # Grant the role manager access to the DB as app and migrator users
    # so that it can performance database checks. This is needed by
    # the infra database tests
    aws_iam_policy.app_db_access.arn,
    aws_iam_policy.migrator_db_access.arn
  ]
}

resource "aws_iam_role_policy" "ssm_access" {
  name = "${var.name}-role-manager-ssm-access"
  role = aws_iam_role.role_manager.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter*"]
        Resource = "${aws_ssm_parameter.random_db_password.arn}"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = [data.aws_kms_key.default_ssm_key.arn]
      }
    ]
  })
}

data "aws_iam_policy_document" "role_manager_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# AWS managed policy required by Lambda functions in order to access VPC resources
# see https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html
data "aws_iam_policy" "lambda_vpc_access" {
  name = "AWSLambdaVPCAccessExecutionRole"
}
