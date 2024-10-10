locals {
  secret             = var.manage_method == "generated" ? aws_ssm_parameter.secret[0] : data.aws_ssm_parameter.secret[0]
  access_policy_name = "${trimprefix(replace(local.secret.name, "/", "-"), "/")}-access"
}

resource "random_password" "secret" {
  count = var.manage_method == "generated" ? 1 : 0

  length           = 64
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_ssm_parameter" "secret" {
  count = var.manage_method == "generated" ? 1 : 0

  name  = var.secret_store_name
  type  = "SecureString"
  value = random_password.secret[0].result
}

data "aws_ssm_parameter" "secret" {
  count = var.manage_method == "manual" ? 1 : 0

  name = var.secret_store_name
}
