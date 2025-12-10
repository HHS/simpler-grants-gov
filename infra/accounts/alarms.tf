# Alarm if logs aren't being created for the containers
resource "aws_cloudwatch_metric_alarm" "container_log_failure" {
  alarm_name          = "logs-missing"
  alarm_description   = "Logs failing for containers"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "DeliveryErrors"
  namespace           = "AWS/Logs"
  period              = 60
  statistic           = "Sum"
  treat_missing_data  = "ignore"
  alarm_actions       = [aws_sns_topic.log_failure.arn]
}
resource "aws_sns_topic" "log_failure" {
  name = "security-no-logs"
  # checkov:skip=CKV_AWS_26:SNS encryption for alerts is unnecessary
}

resource "aws_sns_topic_subscription" "log_failure" {
  topic_arn = aws_sns_topic.log_failure.arn
  protocol  = "email"
  endpoint  = "grantsalerts@navapbc.com"
}
