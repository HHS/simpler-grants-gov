output "secret_arns" {
  value = merge(
    { for k, v in aws_ssm_parameter.secrets : k => v.arn },
    { for k, v in data.aws_ssm_parameter.secrets : k => v.arn }
  )
}
