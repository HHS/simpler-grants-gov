module "secrets" {
  for_each = local.service_config.secrets

  source = "../../modules/secret"

  # When generating secrets and storing them in parameter store, append the
  # terraform workspace to the secret store path if the environment is temporary
  # to avoid conflicts with existing environments.
  # Don't do this for secrets that are managed manually since the temporary
  # environments will need to share those secrets.
  secret_store_name = (each.value.manage_method == "generated" && local.is_temporary ?
    "${each.value.secret_store_name}/${terraform.workspace}" :
    each.value.secret_store_name
  )
  manage_method = each.value.manage_method
}

resource "aws_ssm_parameter" "frontend_api_access_token" {
  #checkov:skip=CKV_AWS_337:Use AWS-managed KMS for terraform-managed SSM parameters
  name  = "/${module.app_config.app_name}/${var.environment_name}/X-API-KEY"
  type  = "SecureString"
  value = "Manually update from internal-${module.app_config.app_name}-${var.environment_name}-key"

  description = "Token that the frontend uses to authenticate when making Grants API fetch requests via API Gateway."

  # Won't overwrite value once changed from the placeholder, this value is set manually from the
  # created key in the API playbook. Terraform cannot dynamically pull the token's value
  lifecycle {
    ignore_changes = [
      value,
    ]
  }
}
