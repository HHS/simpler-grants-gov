locals {
  # If this is a temporary environment, re-use an existing email identity. Otherwise, create a new one.
  domain_identity_arn = local.notifications_config != null ? (
    !local.is_temporary ?
    module.notifications_email_domain[0].domain_identity_arn :
    module.existing_notifications_email_domain[0].domain_identity_arn
  ) : null
  external_ses_email_domains = {
    "infra-dev"      = "dev.simpler.grants.gov"
    "infra-staging"  = "staging.simpler.grants.gov"
    "infra-training" = "training.simpler.grants.gov"
  }
  external_ses_email_domain = local.notifications_config == null ? lookup(local.external_ses_email_domains, var.environment_name, null) : null

  notifications_environment_variables = merge(
    local.notifications_config != null ? {
      AWS_SES_FROM_EMAIL = module.notifications[0].from_email
    } : {},
    local.external_ses_email_domain != null ? {
      AWS_SES_FROM_EMAIL = "notifications@${local.external_ses_email_domain}"
    } : {},
  )
  notifications_app_name = local.notifications_config != null ? "${local.prefix}${local.notifications_config.name}" : ""
  pinpoint_app_id        = local.notifications_config != null ? module.notifications[0].app_id : ""
  ses_configuration_set  = local.network_config.domain_config.hosted_zone != null ? replace(local.network_config.domain_config.hosted_zone, ".", "-") : null

}

# If the app has `enable_notifications` set to true AND this is not a temporary
# environment, then create a email notification identity.
module "notifications_email_domain" {
  count  = local.notifications_config != null && !local.is_temporary ? 1 : 0
  source = "../../modules/notifications-email-domain/resources"

  domain_name = local.network_config.domain_config.hosted_zone
}

# If the app has `enable_notifications` set to true AND this *is* a temporary
# environment, then create a email notification identity.
module "existing_notifications_email_domain" {
  count  = local.notifications_config != null && local.is_temporary ? 1 : 0
  source = "../../modules/notifications-email-domain/data"

  domain_name = local.network_config.domain_config.hosted_zone
}

resource "aws_iam_policy" "external_ses_access" {
  count = local.external_ses_email_domain != null ? 1 : 0

  name        = "${local.service_name}-external-ses-access"
  description = "Send email through the existing ${local.external_ses_email_domain} SES identity and read the account suppression list"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SendSESEmail"
        Effect   = "Allow"
        Action   = "ses:SendEmail"
        Resource = "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:identity/${local.external_ses_email_domain}"
      },
      {
        # ListSuppressedDestinations is account-wide and takes no resource.
        Sid      = "ListSuppressedDestinations"
        Effect   = "Allow"
        Action   = "ses:ListSuppressedDestinations"
        Resource = "*"
      }
    ]
  })
}

# If the app has `enable_notifications` set to true, create a new email notification
# AWS Pinpoint app for the service. A new app is created for all environments, including
# temporary environments.
module "notifications" {
  count  = local.notifications_config != null ? 1 : 0
  source = "../../modules/notifications/resources"

  name                = local.notifications_app_name
  domain_identity_arn = local.domain_identity_arn
  sender_display_name = local.notifications_config.sender_display_name
  sender_email        = local.notifications_config.sender_email
}
