# This module manages an SESv2 email identity.
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  mail_from_domain = "mail.${var.domain_name}"
  dmarc_domain     = "_dmarc.${var.domain_name}"
  dash_domain      = replace(var.domain_name, ".", "-")
}

# Verify email sender identity.
# Docs: https://docs.aws.amazon.com/pinpoint/latest/userguide/channels-email-manage-verify.html
resource "aws_sesv2_email_identity" "sender_domain" {
  email_identity         = var.domain_name
  configuration_set_name = aws_sesv2_configuration_set.email.configuration_set_name
}

# The configuration set applied to messages that is sent through this email channel.
resource "aws_sesv2_configuration_set" "email" {
  configuration_set_name = local.dash_domain

  delivery_options {
    max_delivery_seconds = 300
    tls_policy           = "REQUIRE"
  }

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }
}

resource "aws_sesv2_email_identity_mail_from_attributes" "sender_domain" {
  email_identity   = aws_sesv2_email_identity.sender_domain.email_identity
  mail_from_domain = local.mail_from_domain
}
