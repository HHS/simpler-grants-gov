
# Create SNS topic for all email and external incident management tools notifications

# trivy:ignore:AVD-AWS-0095
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
  threshold           = 0.5
  alarm_description   = "High target latency alert"
  treat_missing_data  = "ignore"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "service_errors" {
  alarm_name          = "${var.service_name}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ErrorCount"
  namespace           = var.service_name
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "ignore"
  alarm_description   = "Alarm for service errors"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]
}


resource "aws_cloudwatch_log_metric_filter" "service_error_filter" {

  name           = "service-error-filter"
  pattern        = "%ERROR | Exception%"
  log_group_name = var.application_log_group

  metric_transformation {
    name      = "ErrorCount"
    namespace = var.service_name # destination namespace for the metrics;
    value     = 1                # value published to the metric name when a Filter Pattern match occurs.
    unit      = "None"           # default option, just looking for errors
  }
}

#email integration

resource "aws_sns_topic_subscription" "email_integration" {
  for_each  = var.email_alert_recipients
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = each.value
}

# Private email route. Resource identity is a stable index, never an email address.
# The value remains sensitive in plans; restricted Terraform state still contains it.
data "aws_ssm_parameter" "private_alert_email" {
  count           = var.email_alert_recipient_parameter_name == null ? 0 : 1
  name            = var.email_alert_recipient_parameter_name
  with_decryption = true
}

resource "aws_sns_topic_subscription" "private_email_integration" {
  count     = var.email_alert_recipient_parameter_name == null ? 0 : 1
  topic_arn = aws_sns_topic.this.arn
  protocol  = "email"
  endpoint  = trimspace(data.aws_ssm_parameter.private_alert_email[0].value)

  lifecycle {
    precondition {
      condition     = data.aws_ssm_parameter.private_alert_email[0].type == "SecureString" && can(regex("^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$", trimspace(data.aws_ssm_parameter.private_alert_email[0].value)))
      error_message = "The alert parameter must be a SecureString containing one valid email address."
    }
  }
}

#External incident management service integration

resource "aws_sns_topic_subscription" "incident_management_service_integration" {
  count                  = var.incident_management_service_integration_url != null ? 1 : 0
  endpoint               = var.incident_management_service_integration_url
  endpoint_auto_confirms = true
  protocol               = "https"
  topic_arn              = aws_sns_topic.this.arn
}
