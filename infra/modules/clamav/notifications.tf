# Single SNS topic for all ClamAV operational alerts:
#   - Scanner publishes here when it finds an infected file.
#   - CloudWatch alarms publish here on freshclam failures and DLQ buildup.
# Subscriptions (email, PagerDuty, Slack via Lambda, etc.) are configured
# by the caller through the alert_email_subscriptions input.

# trivy:ignore:AVD-AWS-0095
resource "aws_sns_topic" "alerts" {
  # checkov:skip=CKV_AWS_26:Topic carries operational metadata (file key, alarm name) — no PII or secrets
  name = "${var.name}-alerts"
}

resource "aws_sns_topic_subscription" "alerts_email" {
  for_each = toset(var.alert_email_subscriptions)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = each.value
}
