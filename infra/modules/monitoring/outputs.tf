output "sns_notification_channel" {
  value = aws_sns_topic.this.arn
}

output "pdf_readability_dashboard_name" {
  value = var.pdf_readability_monitoring == null ? null : aws_cloudwatch_dashboard.pdf_readability[0].dashboard_name
}
