output "public_endpoint" {
  description = "The public endpoint for the service."
  value       = var.enable_load_balancer ? "http://${aws_lb.alb[0].dns_name}" : null
}

output "cdn_endpoint" {
  description = <<EOT
    The CloudFront distribution's own *.cloudfront.net domain name, i.e. the value a DNS
    record for the CDN's alias has to point at. Null when the service has no CDN.
  EOT
  value       = local.enable_cdn ? aws_cloudfront_distribution.cdn[0].domain_name : null
}

output "cdn_distribution_id" {
  description = "The CloudFront distribution's ID, which is what CloudFront API errors name. Null when the service has no CDN."
  value       = local.enable_cdn ? aws_cloudfront_distribution.cdn[0].id : null
}

output "cdn_aliases" {
  description = "The alternate domain names attached to the CloudFront distribution, empty when it only serves its default name."
  value       = local.enable_cdn ? aws_cloudfront_distribution.cdn[0].aliases : []
}

output "cluster_name" {
  value = aws_ecs_cluster.cluster.name
}

output "load_balancer_arn_suffix" {
  description = "The ARN suffix for use with CloudWatch Metrics."
  value       = var.enable_load_balancer ? aws_lb.alb[0].arn_suffix : null
}

output "application_log_group" {
  value = aws_cloudwatch_log_group.service_logs.name
}

output "application_log_stream_prefix" {
  value = local.log_stream_prefix
}

output "migrator_role_arn" {
  description = "ARN for role to use for migration"
  value       = length(aws_iam_role.migrator_task) > 0 ? aws_iam_role.migrator_task[0].arn : null
}

output "opensearch_write_role_arn" {
  description = "ARN for role to use for OpenSearch write operations"
  value       = length(aws_iam_role.opensearch_write) > 0 ? aws_iam_role.opensearch_write[0].arn : null
}

output "workflow_service_role_arn" {
  description = "ARN for role to use for the workflow service"
  value       = length(aws_iam_role.workflow_service) > 0 ? aws_iam_role.workflow_service[0].arn : null
}

output "cluster_arn" {
  value = aws_ecs_cluster.cluster.arn
}

output "task_definition_arn" {
  value = aws_ecs_task_definition.app.arn
}

output "app_service_arn" {
  value = aws_iam_role.app_service.arn
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

output "image_url" {
  description = "image url for the app container"
  value       = local.image_url
}

output "environment_variables" {
  description = "environment variable for the app container"
  value       = local.environment_variables
}

output "nr_host_log_forwarder_arn" {
  description = "ARN of the New Relic host log forwarder Lambda"
  value       = aws_lambda_function.nr_host_log_forwarder.arn
}

output "nr_host_log_forwarder_name" {
  description = "Name of the New Relic host log forwarder Lambda"
  value       = aws_lambda_function.nr_host_log_forwarder.function_name
}

output "s3_bucket_ids" {
  description = "Map of s3_buckets keys to their generated bucket IDs."
  value       = { for k, v in aws_s3_bucket.s3_buckets : k => v.id }
}

output "s3_bucket_arns" {
  description = "Map of s3_buckets keys to their generated bucket ARNs."
  value       = { for k, v in aws_s3_bucket.s3_buckets : k => v.arn }
}
