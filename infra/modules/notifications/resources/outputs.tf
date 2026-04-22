output "access_policy_arn" {
  value = aws_iam_policy.access.arn
}

output "from_email" {
  value = var.sender_display_name != null ? "${var.sender_display_name} <${var.sender_email}>" : var.sender_email
}
