output "search_config" {
  value = var.has_search ? {
    instance_type           = var.search_data_instance_type
    instance_count          = var.search_data_instance_count
    dedicated_master_type   = var.search_master_instance_type
    engine_version          = var.search_engine_version
    volume_size             = var.search_data_volume_size
    availability_zone_count = var.search_availability_zone_count
  } : null
}

output "database_config" {
  value = local.database_config
}

output "feature_flags_config" {
  value = local.feature_flags_config
}

output "scheduled_jobs" {
  value = local.scheduled_jobs
}

output "monitoring_config" {
  value = local.monitoring_config
}

output "network_name" {
  value = var.network_name
}

output "domain_config" {
  value = local.domain_config
}

output "service_config" {
  value = local.service_config
}

output "identity_provider_config" {
  value = local.identity_provider_config
}

output "notifications_config" {
  value = local.notifications_config
}

output "storage_config" {
  value = {
    # Include project name in bucket name since buckets need to be globally unique across AWS
    bucket_name = local.bucket_name
  }
}

output "s3_buckets" {
  value = local.s3_buckets
}

output "incident_management_service_integration" {
  value = var.has_incident_management_service ? {
    integration_url_param_name = "/monitoring/${var.app_name}/${var.environment}/incident-management-integration-url"
  } : null
}

output "sqs_config" {
  value = local.sqs_config
}
