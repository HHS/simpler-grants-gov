output "user_pool_id" {
  description = "The ID of the user pool."
  value       = tolist(data.aws_cognito_user_pools.existing_user_pools.ids)[0]
}
