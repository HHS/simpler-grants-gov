output "environment_name" {
  value = var.environment_name
}

# output "cdn_endpoint" {
#   description = "The CDN endpoint for the service."
#   value       = module.service.cdn_endpoint
# }

output "application_log_group" {
  value = module.service.application_log_group
}

output "application_log_stream_prefix" {
  value = module.service.application_log_stream_prefix
}

output "migrator_role_arn" {
  value = module.service.migrator_role_arn
}

output "service_cluster_name" {
  value = module.service.cluster_name
}

output "service_endpoint" {
  description = "The public endpoint for the service."
  value       = module.service.public_endpoint
}

output "service_name" {
  value = local.service_config.service_name
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution for cache invalidation"
  value       = module.service.cloudfront_distribution_id
}
