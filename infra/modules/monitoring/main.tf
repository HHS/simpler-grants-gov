
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
  treat_missing_data  = "ignore"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "app_response_time_anomalies" {
  # test alarm using anomaly detection to monitor response time.
  # a PR-worthy alarm will need to track something else to get service errors
  alarm_name          = "${var.service_name}-response-time-anomalies"
  comparison_operator = "GreaterThanUpperThreshold"
  evaluation_periods  = 5
  threshold_metric_id = "q1"
  alarm_description   = "Anomalies with latency"
  treat_missing_data  = "ignore"
  # commented for testing
  # alarm_actions       = [aws_sns_topic.this.arn]
  # ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    LoadBalancer = var.load_balancer_arn_suffix
  }

  # upper band for anomaly detection
  metric_query {
    id          = "q1"
    label       = "expectedLevel(m1)"
    return_data = "true"
    expression  = "ANOMALY_DETECTION_BAND(m1)"
  }

  metric_query {
    id          = "m1"
    return_data = "true"

    metric {
      metric_name = "TargetResponseTime"
      namespace   = "AWS/ApplicationELB"
      period      = 60
      stat        = "Average"
      unit        = "Count"
    }
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

