output "app_name" {
  value = local.app_name
}

output "account_names_by_environment" {
  value = local.account_names_by_environment
}

output "build_repository_config" {
  value = local.build_repository_config
}

output "environment_configs" {
  value = local.environment_configs
}

output "environments" {
  value = local.environments
}

output "has_database" {
  value = local.has_database
}

output "has_external_non_aws_service" {
  value = local.has_external_non_aws_service
}

output "has_incident_management_service" {
  value = local.has_incident_management_service
}

output "image_repository_name" {
  value = local.image_repository_name
}

output "enable_identity_provider" {
  value = local.enable_identity_provider
}

output "enable_notifications" {
  value = local.enable_notifications
}

output "shared_network_name" {
  value = local.shared_network_name
}
