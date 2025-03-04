output "service_endpoint" {
  description = "The public endpoint for the service."
  value       = module.service.public_endpoint
}

output "service_cluster_name" {
  value = module.service.cluster_name
}

output "service_name" {
  value = local.service_config.service_name
}

output "application_log_group" {
  value = module.service.application_log_group
}

output "application_log_stream_prefix" {
  value = module.service.application_log_stream_prefix
}

output "migrator_role_arn" {
  value = module.service.migrator_role_arn
}
