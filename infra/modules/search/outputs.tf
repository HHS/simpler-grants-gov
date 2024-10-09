output "password_arn" {
  value = aws_ssm_parameter.opensearch_password.arn
}

output "username_arn" {
  value = aws_ssm_parameter.opensearch_username.arn
}

output "endpoint_arn" {
  value = aws_ssm_parameter.opensearch_endpoint.arn
}
