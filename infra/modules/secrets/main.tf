locals {
  generated_secrets = {
    for name, config in var.secrets :
    name => config if config.manage_method == "generated"
  }
  manual_secrets = {
    for name, config in var.secrets :
    name => config if config.manage_method == "manual"
  }
}

resource "random_password" "secrets" {
  for_each = local.generated_secrets

  length           = 64
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_ssm_parameter" "secrets" {
  for_each = local.generated_secrets

  name  = each.value.secret_store_name
  type  = "SecureString"
  value = random_password.secrets[each.key].result
}

data "aws_ssm_parameter" "secrets" {
  for_each = local.manual_secrets

  name = each.value.secret_store_name
}
