output "application_log_group" {
  value = module.service.application_log_group
}

output "application_log_stream_prefix" {
  value = module.service.application_log_stream_prefix
}

output "migrator_role_arn" {
  value = module.service.migrator_role_arn
}

output "migrator_username" {
  value = module.app_config.has_database ? module.database[0].migrator_username : null
}

output "pinpoint_app_id" {
  value = local.notifications_config != null ? module.notifications[0].app_id : null
}

output "service_cluster_name" {
  value = module.service.cluster_name
}

output "service_endpoint" {
  description = "The public endpoint for the service."
  value       = module.service.public_endpoint
}

output "service_name" {
  value = local.service_name
}
