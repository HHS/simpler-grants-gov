output "public_endpoint" {
  description = "The public endpoint for the service."
  value       = var.enable_load_balancer ? "http://${aws_lb.alb[0].dns_name}" : null
}

# output "cdn_endpoint" {
#   description = "The CDN endpoint for the service."
#   value       = var.enable_cdn ? aws_cloudfront_distribution.cdn[0].domain_name : null
# }

output "cluster_name" {
  value = aws_ecs_cluster.cluster.name
}

output "load_balancer_arn_suffix" {
  description = "The ARN suffix for use with CloudWatch Metrics."
  value       = var.enable_load_balancer ? aws_lb.alb[0].arn_suffix : null
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

output "public_endpoint" {
  description = "The public endpoint for the service."
  value       = "${var.certificate_arn != null ? "https" : "http"}://${local.domain_name != null ? local.domain_name : aws_lb.alb.dns_name}"
}
