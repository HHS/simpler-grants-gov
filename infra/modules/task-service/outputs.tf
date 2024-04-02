output "cluster_name" {
  value = aws_ecs_cluster.cluster.name
}

output "application_log_group" {
  value = local.log_group_name
}

output "application_log_stream_prefix" {
  value = local.log_stream_prefix
}

output "migrator_role_arn" {
  description = "ARN for role to use for migration"
  value       = length(aws_iam_role.migrator_task) > 0 ? aws_iam_role.migrator_task[0].arn : null
}

output "cluster_arn" {
  value = aws_ecs_cluster.cluster.arn
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "task_role_arn" {
  value = aws_iam_role.task_executor.arn
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "service_logs_arn" {
  value = aws_cloudwatch_log_group.service_logs.arn
}
