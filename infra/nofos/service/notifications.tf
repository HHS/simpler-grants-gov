locals {
  # If this is a temporary environment, re-use an existing email identity. Otherwise, create a new one.
  domain_identity_arn = local.notifications_config != null ? (
    !local.is_temporary ?
    module.notifications_email_domain[0].domain_identity_arn :
    module.existing_notifications_email_domain[0].domain_identity_arn
  ) : null
  notifications_environment_variables = local.notifications_config != null ? {
    AWS_PINPOINT_APP_ID       = module.notifications[0].app_id,
    AWS_PINPOINT_SENDER_EMAIL = local.notifications_config.sender_email
  } : {}
  notifications_app_name = local.notifications_config != null ? "${local.prefix}${local.notifications_config.name}" : ""
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
