output "user_pool_id" {
  description = "The ID of the user pool."
  value       = aws_cognito_user_pool.main.id
}
