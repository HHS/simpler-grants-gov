data "aws_ssm_parameter" "secret" {
  for_each = { for secret in var.secrets : secret.name => secret }
  name     = each.value.ssm_param_name
}

locals {
  secrets = [
    for secret in var.secrets :
    {
      name      = secret.name,
      valueFrom = data.aws_ssm_parameter.secret[secret.name].arn
    }
  ]
}
