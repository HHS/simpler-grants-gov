resource "aws_cognito_user_pool_client" "client" {
  name         = var.name
  user_pool_id = var.user_pool_id

  callback_urls                = var.callback_urls
  logout_urls                  = var.logout_urls
  supported_identity_providers = ["COGNITO"]
  refresh_token_validity       = 1
  access_token_validity        = 60
  id_token_validity            = 60
  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  generate_secret                      = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["phone", "email", "openid", "profile"]
  explicit_auth_flows                  = ["ALLOW_ADMIN_USER_PASSWORD_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]

  # Avoid security issue where error messages indicate when a user doesn't exist
  prevent_user_existence_errors = "ENABLED"

  enable_token_revocation                       = true
  enable_propagate_additional_user_context_data = false

  read_attributes  = ["email", "email_verified", "phone_number", "phone_number_verified", "updated_at"]
  write_attributes = ["email", "updated_at", "phone_number"]
}

resource "aws_ssm_parameter" "client_secret" {
  name  = "/${var.name}/identity-provider/client-secret"
  type  = "SecureString"
  value = aws_cognito_user_pool_client.client.client_secret
}
