locals {
  secrets = [
    for secret in var.secrets :
    {
      name      = secret.name,
      valueFrom = secret.ssm_param_name
    }
  ]

  secret_arn_patterns = [
    for secret in var.secrets :
    "arn:aws:ssm:*:*:parameter/${trimprefix(secret.ssm_param_name, "/")}"
  ]
}
