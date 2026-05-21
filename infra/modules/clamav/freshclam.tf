data "archive_file" "freshclam" {
  type        = "zip"
  output_path = "${path.module}/freshclam.zip"
  source_file = "${path.module}/src/update_definitions.py"
}

resource "aws_iam_role" "freshclam" {
  name               = "${local.freshclam_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "freshclam_vpc" {
  role       = aws_iam_role.freshclam.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "freshclam_efs" {
  statement {
    effect = "Allow"
    actions = [
      "elasticfilesystem:ClientMount",
      "elasticfilesystem:ClientWrite",
      "elasticfilesystem:DescribeMountTargets",
    ]
    resources = [aws_efs_file_system.clamav.arn]
    condition {
      test     = "StringEquals"
      variable = "elasticfilesystem:AccessPointArn"
      values   = [aws_efs_access_point.clamav.arn]
    }
  }
}

resource "aws_iam_role_policy" "freshclam_efs" {
  name   = "${local.freshclam_name}-efs"
  role   = aws_iam_role.freshclam.id
  policy = data.aws_iam_policy_document.freshclam_efs.json
}

resource "aws_cloudwatch_log_group" "freshclam" {
  # checkov:skip=CKV_AWS_158:Lambda logs contain only signature-refresh outcomes — AWS-managed encryption is sufficient
  # checkov:skip=CKV_AWS_338:30 days is enough for Lambda diagnostic logs;
  name              = local.freshclam_log_group
  retention_in_days = 30
}

resource "aws_lambda_function" "freshclam" {
  # checkov:skip=CKV_AWS_116:DLQ not required for this scaffold
  # checkov:skip=CKV_AWS_173:Env vars contain no secrets
  # checkov:skip=CKV_AWS_272:Code signing not required for this scaffold

  function_name = local.freshclam_name
  description   = "Refreshes the ClamAV signature database on EFS"
  role          = aws_iam_role.freshclam.arn

  filename         = data.archive_file.freshclam.output_path
  source_code_hash = data.archive_file.freshclam.output_base64sha256
  runtime          = "python3.14"
  handler          = "update_definitions.lambda_handler"

  layers      = [aws_lambda_layer_version.clamav.arn]
  memory_size = 10240
  timeout     = 900

  ephemeral_storage {
    size = 10240
  }

  # Only allow one update at a time to keep the DB consistent.
  reserved_concurrent_executions = 1

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  file_system_config {
    arn              = aws_efs_access_point.clamav.arn
    local_mount_path = local.efs_mount_path
  }

  environment {
    variables = {
      CLAMAV_DB_DIR = local.efs_mount_path
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_efs_mount_target.clamav,
    aws_cloudwatch_log_group.freshclam,
  ]
}

resource "aws_cloudwatch_event_rule" "freshclam_schedule" {
  name                = "${local.freshclam_name}-schedule"
  description         = "Triggers ClamAV signature refresh"
  schedule_expression = var.freshclam_schedule
}

resource "aws_cloudwatch_event_target" "freshclam_schedule" {
  rule      = aws_cloudwatch_event_rule.freshclam_schedule.name
  target_id = "freshclam"
  arn       = aws_lambda_function.freshclam.arn
}

resource "aws_lambda_permission" "allow_eventbridge_invoke" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.freshclam.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.freshclam_schedule.arn
}
