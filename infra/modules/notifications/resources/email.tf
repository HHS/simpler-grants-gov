resource "aws_pinpoint_email_channel" "app" {
  application_id = aws_pinpoint_app.app.application_id
  from_address   = var.sender_display_name != null ? "${var.sender_display_name} <${var.sender_email}>" : var.sender_email
  identity       = var.domain_identity_arn
}
