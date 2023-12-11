
# Create SNS topic for all email and external incident management tools notifications

resource "aws_sns_topic" "this" {
  name = "${var.service_name}-monitoring"

  # checkov:skip=CKV_AWS_26:SNS encryption for alerts is unnecessary
}

# Create CloudWatch alarms for the service

resource "aws_cloudwatch_metric_alarm" "high_app_http_5xx_count" {
  alarm_name          = "${var.service_name}-high-app-5xx-count"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "High HTTP service 5XX error count"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_load_balancer_http_5xx_count" {
  alarm_name          = "${var.service_name}-high-load-balancer-5xx-count"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "HTTPCode_ELB_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "High HTTP ELB 5XX error count"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "high_app_response_time" {
  alarm_name          = "${var.service_name}-high-app-response-time"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0.2
  alarm_description   = "High target latency alert"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }
}

#email integration

resource "aws_sns_topic_subscription" "email_integration" {
  for_each  = var.email_alerts_subscription_list
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = each.value
}

#External incident management service integration

resource "aws_sns_topic_subscription" "incident_management_service_integration" {
  count                  = var.incident_management_service_integration_url != null ? 1 : 0
  endpoint               = var.incident_management_service_integration_url
  endpoint_auto_confirms = true
  protocol               = "https"
  topic_arn              = aws_sns_topic.this.arn
}


# TODO: Move to own file
#
# Synthetic Canary Resources:
#
#

# Logging Bucket 
resource "aws_s3_bucket" "canary-reports" {
  # contains the zip and the canary logs
  bucket = "s3-canaries-reports"
}
resource "aws_s3_bucket_versioning" "canary-reports" {
  bucket = aws_s3_bucket.canary-reports.id
  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_public_access_block" "canary-reports" {
  bucket = aws_s3_bucket.canary-reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_iam_role" "canary-reports" {
  name               = "homepage-monitoring"
  assume_role_policy = data.aws_iam_policy_document.canary-reports.json
}

data "aws_iam_policy_document" "canary-reports" {
  statement {
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = [aws_synthetics_canary.canary.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation"]
    resources = [aws_synthetics_canary.canary.arn]
  }
  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:CreateLogGroup"]
    resources = ["arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"]
  }
  statement {
    effect    = "Allow"
    resources = ["*"]
    actions   = ["cloudwatch:PutMetricData"]
    condition {
      test     = "StringEquals"
      variable = "cloudwatch:namespace"
      values   = ["CloudWatchSynthetics"]
    }
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:ListAllMyBuckets", "xray:PutTraceSegments"]
    resources = ["*"]
  }
}

# Lambda which runs the script for the canary
resource "aws_lambda_function" "canary-reports" {
  filename      = "canary_script_payload.zip"
  function_name = "homepage-monitoring"
  role          = ""
  handler       = "canary.handler"
  runtime       = "python3.8"
}
data "archive_file" "lambda" {
  type        = "zip"
  source_file = "canary_script.py"
  output_path = "canary_script_payload.zip"
}
# Assume role for the canary
resource "aws_iam_role" "canary-role" {
  name               = "canary-role"
  assume_role_policy = data.aws_iam_policy_document.canary-assume-role-policy.json
}
data "aws_iam_policy_document" "canary-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      identifiers = ["lambda.amazonaws.com"]
      type        = "Service"
    }
  }
}
# Canary
resource "aws_synthetics_canary" "canary" {
  name                 = "homepage-monitoring"
  artifact_s3_location = "s3://${aws_s3_bucket.canary-reports.id}/"
  execution_role_arn   = aws_iam_role.canary-reports.arn
  runtime_version      = "syn-python-selenium-2.0"
  handler              = "canary.handler"
  start_canary         = true
  zip_file             = data.archive_file.lambda.output_path

  success_retention_period = 2
  failure_retention_period = 14

  schedule {
    expression          = "rate( 5 minutes)"
    duration_in_seconds = 0
  }

  run_config {
    timeout_in_seconds = 15
    active_tracing     = false
  }

  tags = {
    Name = "canary"
  }
  depends_on = [aws_s3_bucket.canary-reports]

}
