output "password_arn" {
  value = aws_ssm_parameter.opensearch_password.arn
}

output "username" {
  value = aws_ssm_parameter.opensearch_username.value
}

output "endpoint" {
  value = aws_ssm_parameter.opensearch_endpoint.value
}
