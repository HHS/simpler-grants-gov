############################################################################################
## A module for configuring a Cognito User Pool
## - Configures for email, but not SMS
## - Configures MFA
############################################################################################

locals {
  dash_domain = var.domain_name != null ? replace(var.domain_name, ".", "-") : null
}

resource "aws_cognito_user_pool" "main" {
  name = var.name

  # Use a separate line to support automated terraform destroy commands
  deletion_protection = var.is_temporary ? "INACTIVE" : "ACTIVE"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  device_configuration {
    challenge_required_on_new_device      = true
    device_only_remembered_on_user_prompt = true
  }

  email_configuration {
    # Use this SES email to send cognito emails. If we're not using SES for emails then use null.
    # Optionally configures the FROM address and the REPLY-TO address.
    # Optionally configures using the Cognito default email or using SES.
    source_arn            = var.domain_identity_arn
    configuration_set     = local.dash_domain
    email_sending_account = var.domain_identity_arn != null ? "DEVELOPER" : "COGNITO_DEFAULT"
    # Customize the name that users see in the "From" section of their inbox, so that it's clearer who the email is from.
    # This name also needs to be updated manually in the Cognito console for each environment's Advanced Security emails.
    from_email_address     = var.domain_identity_arn != null ? (var.sender_display_name != null ? "${var.sender_display_name} <${var.sender_email}>" : var.sender_email) : null
    reply_to_email_address = var.reply_to_email
  }

  password_policy {
    minimum_length                   = var.password_minimum_length
    temporary_password_validity_days = var.temporary_password_validity_days
  }

  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = true
  }

  user_pool_add_ons {
    advanced_security_mode = "AUDIT"
  }

  username_configuration {
    case_sensitive = false
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    mutable             = "true"
    required            = "true"

    string_attribute_constraints {
      max_length = 2048
      min_length = 0
    }
  }

  # Optionally configures email template for resetting a password
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = var.verification_email_message != null ? var.verification_email_message : null
    email_subject        = var.verification_email_subject != null ? var.verification_email_subject : null
  }
}
