data "aws_sesv2_email_identity" "main" {
  email_identity = var.domain_name
}
