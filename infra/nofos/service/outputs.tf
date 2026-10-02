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

output "pdf_readability_dashboard_name" {
  value = module.monitoring.pdf_readability_dashboard_name
}

output "monitoring_notification_topic_arn" {
  value = module.monitoring.sns_notification_channel
}

output "pdf_readability_alarm_actions_enabled" {
  value = local.service_config.pdf_readability_alarm_actions_enabled
}
