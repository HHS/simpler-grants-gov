output "app_id" {
  value = aws_pinpoint_app.app.application_id
}

# Sender address for SES, formatted as "Display Name <sender@domain>" when a
# display name is configured, otherwise just the sender email. The backend
# can read this via the AWS_SES_FROM_EMAIL env var and switch from Pinpoint
# to SES at its own pace; the Pinpoint app_id output above stays available
# until the migration is complete.
output "from_email" {
  value = var.sender_display_name != null ? "${var.sender_display_name} <${var.sender_email}>" : var.sender_email
}
