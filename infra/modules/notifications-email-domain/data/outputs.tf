output "domain_identity_arn" {
  value = data.aws_sesv2_email_identity.main.arn
}
