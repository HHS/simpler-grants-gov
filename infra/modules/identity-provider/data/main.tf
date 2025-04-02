############################################################################################
## A module for retrieving an existing Cognito User Pool
############################################################################################
data "aws_cognito_user_pools" "existing_user_pools" {
  name = var.name
}
