output "sns_notification_channel" {
  value = aws_sns_topic.this.arn
}
