output "role_manager_function_name" {
  value = aws_lambda_function.role_manager.function_name
}

output "engine_version" {
  value = aws_rds_cluster.db.engine_version_actual
}
