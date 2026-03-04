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

output "network_name" {
  value = var.network_name
}

output "service_config" {
  value = {
    region                          = var.default_region
    instance_desired_instance_count = var.instance_desired_instance_count
    instance_scaling_max_capacity   = var.instance_scaling_max_capacity
    instance_scaling_min_capacity   = var.instance_scaling_min_capacity
    database_engine_version         = var.database_engine_version
    instance_cpu                    = var.instance_cpu
    instance_memory                 = var.instance_memory
    service_name                    = "${local.prefix}${var.app_name}-${var.environment}"
    domain_name                     = var.domain_name
    secondary_domain_names          = var.secondary_domain_names
    s3_cdn_domain_name              = var.s3_cdn_domain_name
    mtls_domain_name                = var.mtls_domain_name
    enable_https                    = var.enable_https
    region                          = var.default_region
    cpu                             = var.instance_cpu
    memory                          = var.instance_memory
    desired_instance_count          = var.instance_desired_instance_count
    enable_command_execution        = var.enable_command_execution

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

output "scheduled_jobs" {
  value = local.scheduled_jobs
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

output "workflow_service_config" {
  value = {
    enable        = var.enable_workflow_service
    cpu           = var.workflow_service_cpu
    memory        = var.workflow_service_memory
    desired_count = var.workflow_service_desired_count
  }
}
