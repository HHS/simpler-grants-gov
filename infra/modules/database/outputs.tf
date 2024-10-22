output "role_manager_function_name" {
  value = aws_lambda_function.role_manager.function_name
}

output "database_security_group_id" {
  value = aws_security_group.db.id
}
