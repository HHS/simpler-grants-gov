data "archive_file" "scanner" {
  type        = "zip"
  output_path = "${path.module}/scanner.zip"
  source_file = "${path.module}/src/scan.py"
}

resource "aws_iam_role" "scanner" {
  name               = "${local.scanner_name}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "scanner_vpc" {
  role       = aws_iam_role.scanner.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "scanner_efs" {
  statement {
    effect = "Allow"
    actions = [
      "elasticfilesystem:ClientMount",
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

resource "aws_iam_role_policy" "scanner_efs" {
  name   = "${local.scanner_name}-efs"
  role   = aws_iam_role.scanner.id
  policy = data.aws_iam_policy_document.scanner_efs.json
}

data "aws_iam_policy_document" "scanner_s3" {
  statement {
    sid     = "ReadUnscanned"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${var.s3_bucket_arn}/${var.unscanned_prefix}*",
    ]
  }

  statement {
    sid    = "MoveScanResult"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:PutObjectTagging",
      "s3:DeleteObject",
    ]
    resources = [
      "${var.s3_bucket_arn}/${var.scanned_prefix}*",
      "${var.s3_bucket_arn}/${var.failed_prefix}*",
      "${var.s3_bucket_arn}/${var.unscanned_prefix}*",
    ]
  }
}

resource "aws_iam_role_policy" "scanner_s3" {
  name   = "${local.scanner_name}-s3"
  role   = aws_iam_role.scanner.id
  policy = data.aws_iam_policy_document.scanner_s3.json
}

# Dead-letter queue for scanner invocations that fail after Lambda's
# async retry budget is exhausted.
resource "aws_sqs_queue" "scanner_dlq" {
  # checkov:skip=CKV_AWS_27:Server-side encryption with SQS-managed keys is enabled below
  name                      = "${local.scanner_name}-dlq"
  message_retention_seconds = var.scanner_dlq_retention_seconds
  sqs_managed_sse_enabled   = true
}

data "aws_iam_policy_document" "scanner_dlq" {
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.scanner_dlq.arn]
  }
}

resource "aws_iam_role_policy" "scanner_dlq" {
  name   = "${local.scanner_name}-dlq"
  role   = aws_iam_role.scanner.id
  policy = data.aws_iam_policy_document.scanner_dlq.json
}

# Alarm when the DLQ has anything in it.
resource "aws_cloudwatch_metric_alarm" "scanner_dlq_depth" {
  alarm_name          = "${local.scanner_name}-dlq-not-empty"
  alarm_description   = "Scanner DLQ has messages — async scan failures need manual replay"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.dlq_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = aws_sqs_queue.scanner_dlq.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_log_group" "scanner" {
  # checkov:skip=CKV_AWS_158:Lambda logs contain only scan outcomes — AWS-managed encryption is sufficient
  # checkov:skip=CKV_AWS_338:30 days is enough for Lambda diagnostic logs;
  name              = local.scanner_log_group
  retention_in_days = 30
}

resource "aws_lambda_function" "scanner" {
  # checkov:skip=CKV_AWS_173:Env vars contain no secrets
  # checkov:skip=CKV_AWS_272:Code signing not required for this scaffold

  function_name = local.scanner_name
  description   = "Scans files uploaded to ${var.unscanned_prefix} with ClamAV"
  role          = aws_iam_role.scanner.arn

  filename         = data.archive_file.scanner.output_path
  source_code_hash = data.archive_file.scanner.output_base64sha256
  runtime          = "python3.13"
  handler          = "scan.lambda_handler"

  layers      = [aws_lambda_layer_version.clamav.arn]
  memory_size = var.scanner_memory_size
  timeout     = var.scanner_timeout

  # Bound parallel scans so a burst of uploads can't exhaust the account
  # Lambda quota or overwhelm EFS. Tune via var.scanner_reserved_concurrency.
  reserved_concurrent_executions = var.scanner_reserved_concurrency

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
  }

  file_system_config {
    arn              = aws_efs_access_point.clamav.arn
    local_mount_path = local.efs_mount_path
  }

  # Async (S3-triggered) failures past Lambda's retry budget land here for
  # manual inspection and replay.
  dead_letter_config {
    target_arn = aws_sqs_queue.scanner_dlq.arn
  }

  environment {
    variables = {
      CLAMAV_DB_DIR       = local.efs_mount_path
      UNSCANNED_PREFIX    = var.unscanned_prefix
      SCANNED_PREFIX      = var.scanned_prefix
      FAILED_PREFIX       = var.failed_prefix
      MAX_FILE_SIZE_BYTES = tostring(var.scanner_max_file_size_bytes)
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [
    aws_efs_mount_target.clamav,
    aws_cloudwatch_log_group.scanner,
    aws_iam_role_policy.scanner_dlq,
  ]
}

resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scanner.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = var.s3_bucket_arn
}

resource "aws_s3_bucket_notification" "scanner" {
  bucket = var.s3_bucket_id

  lambda_function {
    lambda_function_arn = aws_lambda_function.scanner.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = var.unscanned_prefix
  }

  # The bootstrap invocation guarantees freshclam has populated the DB
  # before S3 starts delivering events to the scanner.
  depends_on = [
    aws_lambda_permission.allow_s3_invoke,
    aws_lambda_invocation.freshclam_bootstrap,
  ]
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}
