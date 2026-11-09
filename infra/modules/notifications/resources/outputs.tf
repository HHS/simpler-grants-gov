output "access_policy_arn" {
  value = aws_iam_policy.access.arn
}

# Sender address for SES, formatted as "Display Name <sender@domain>" when a
# display name is configured, otherwise just the sender email. Passed to the
# app as the AWS_SES_FROM_EMAIL env var.
output "from_email" {
  value = var.sender_display_name != null ? "${var.sender_display_name} <${var.sender_email}>" : var.sender_email
}
