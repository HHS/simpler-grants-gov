locals {
  # If this is a temporary environment, re-use an existing email identity. Otherwise, create a new one.
  domain_identity_arn = local.notifications_config != null ? (
    !local.is_temporary ?
    module.notifications_email_domain[0].domain_identity_arn :
    module.existing_notifications_email_domain[0].domain_identity_arn
  ) : null
  external_ses_email_domains = {
    "infra-dev"      = "dev.simpler.grants.gov"
    "infra-sgg1"     = "dev.simpler.grants.gov" # Same AWS account as infra-dev; shares its identity
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
  ses_configuration_set  = local.network_config.domain_config.hosted_zone != null ? replace(local.network_config.domain_config.hosted_zone, ".", "-") : null

  external_ses_configuration_set = local.external_ses_email_domain != null ? replace(local.external_ses_email_domain, ".", "-") : null
  external_ses_identity_owners   = ["infra-dev", "infra-staging", "infra-training"]
  managed_external_ses_domains = toset(
    local.external_ses_email_domain != null && !local.is_temporary && contains(local.external_ses_identity_owners, var.environment_name)
    ? [local.external_ses_email_domain] : []
  )
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
        # Required once the identity has a default configuration set.
        Sid      = "SendSESEmailConfigurationSet"
        Effect   = "Allow"
        Action   = "ses:SendEmail"
        Resource = "arn:aws:ses:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:configuration-set/${local.external_ses_configuration_set}"
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

# Configuration set for the manually created identity in external SES envs, mirroring prod.
resource "aws_sesv2_configuration_set" "external" {
  for_each = local.managed_external_ses_domains

  configuration_set_name = local.external_ses_configuration_set

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

# Send SES events to CloudWatch, dimensioned by the app's email_type message tag.
resource "aws_sesv2_configuration_set_event_destination" "external_logs" {
  for_each = aws_sesv2_configuration_set.external

  configuration_set_name = each.value.configuration_set_name
  event_destination_name = "${each.value.configuration_set_name}-email-identity-logs"

  event_destination {
    enabled = true
    matching_event_types = [
      "BOUNCE",
      "CLICK",
      "COMPLAINT",
      "DELIVERY",
      "OPEN",
      "REJECT",
      "RENDERING_FAILURE",
      "SEND",
    ]

    cloud_watch_destination {
      dimension_configuration {
        dimension_name          = "email_type"
        dimension_value_source  = "MESSAGE_TAG"
        default_dimension_value = "other"
      }
    }
  }
}

# Adopt the manually created identity so its default configuration set is managed.
import {
  for_each = local.managed_external_ses_domains
  to       = aws_sesv2_email_identity.external[each.key]
  id       = each.key
}

resource "aws_sesv2_email_identity" "external" {
  for_each = local.managed_external_ses_domains

  email_identity         = each.key
  configuration_set_name = aws_sesv2_configuration_set.external[each.key].configuration_set_name

  # IAM must allow the configuration set before it becomes the identity default.
  depends_on = [aws_iam_policy.external_ses_access]

  lifecycle {
    prevent_destroy = true
  }
}

# If the app has `enable_notifications` set to true, create the email notification
# sender and SES send policy for the service. One is created for all environments, including
# temporary environments.
module "notifications" {
  count  = local.notifications_config != null ? 1 : 0
  source = "../../modules/notifications/resources"

  name                = local.notifications_app_name
  domain_identity_arn = local.domain_identity_arn
  sender_display_name = local.notifications_config.sender_display_name
  sender_email        = local.notifications_config.sender_email
}
