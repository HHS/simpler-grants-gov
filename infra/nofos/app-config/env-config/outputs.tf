output "database_config" {
  value = local.database_config
}

output "scheduled_jobs" {
  value = local.scheduled_jobs
}

output "incident_management_service_integration" {
  value = var.has_incident_management_service ? {
    integration_url_param_name = "/monitoring/${var.app_name}/${var.environment}/incident-management-integration-url"
  } : null
}

output "network_name" {
  value = var.network_name
}

output "service_config" {
  value = {
    service_name             = "${local.prefix}${var.app_name}-${var.environment}"
    domain_name              = var.domain_name
    enable_https             = var.enable_https
    region                   = var.default_region
    cpu                      = var.service_cpu
    memory                   = var.service_memory
    desired_instance_count   = var.service_desired_instance_count
    enable_command_execution = var.enable_command_execution

    extra_environment_variables = merge(
      local.default_extra_environment_variables,
      var.service_override_extra_environment_variables
    )

    secrets = local.secrets

    file_upload_jobs = {
      for job_name, job_config in local.file_upload_jobs :
      # For job configs that don't define a source_bucket, add the source_bucket config property
      job_name => merge({ source_bucket = local.bucket_name }, job_config)
    }
  }
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
