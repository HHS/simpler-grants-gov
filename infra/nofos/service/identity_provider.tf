locals {
  # If this is a temporary environment, re-use an existing Cognito user pool. Otherwise, create a new one.
  identity_provider_user_pool_id = module.app_config.enable_identity_provider ? (
    local.is_temporary ? module.existing_identity_provider[0].user_pool_id : module.identity_provider[0].user_pool_id
  ) : null
  identity_provider_environment_variables = module.app_config.enable_identity_provider ? {
    COGNITO_USER_POOL_ID = local.identity_provider_user_pool_id,
    COGNITO_CLIENT_ID    = module.identity_provider_client[0].client_id
  } : {}
}

# If the app has `enable_identity_provider` set to true AND this is not a temporary
# environment, then create a new identity provider.
module "identity_provider" {
  count  = module.app_config.enable_identity_provider && !local.is_temporary ? 1 : 0
  source = "../../modules/identity-provider/resources"

  is_temporary = local.is_temporary

  name                             = local.identity_provider_config.identity_provider_name
  password_minimum_length          = local.identity_provider_config.password_policy.password_minimum_length
  temporary_password_validity_days = local.identity_provider_config.password_policy.temporary_password_validity_days
  verification_email_message       = local.identity_provider_config.verification_email.verification_email_message
  verification_email_subject       = local.identity_provider_config.verification_email.verification_email_subject
  domain_name                      = local.network_config.domain_config.hosted_zone
  domain_identity_arn              = local.notifications_config == null ? null : local.domain_identity_arn
  sender_email                     = local.notifications_config == null ? null : local.notifications_config.sender_email
  sender_display_name              = local.notifications_config == null ? null : local.notifications_config.sender_display_name
  reply_to_email                   = local.notifications_config == null ? null : local.notifications_config.reply_to_email
}

# If the app has `enable_identity_provider` set to true AND this *is* a temporary
# environment, then use an existing identity provider.
module "existing_identity_provider" {
  count  = module.app_config.enable_identity_provider && local.is_temporary ? 1 : 0
  source = "../../modules/identity-provider/data"

  name = local.identity_provider_config.identity_provider_name
}

# If the app has `enable_identity_provider` set to true, create a new identity provider
# client for the service. A new client is created for all environments, including
# temporary environments.
module "identity_provider_client" {
  count  = module.app_config.enable_identity_provider ? 1 : 0
  source = "../../modules/identity-provider-client/resources"

  callback_urls = local.identity_provider_config.client.callback_urls
  logout_urls   = local.identity_provider_config.client.logout_urls
  name          = "${local.prefix}${local.identity_provider_config.identity_provider_name}"

  user_pool_id = local.identity_provider_user_pool_id
}
