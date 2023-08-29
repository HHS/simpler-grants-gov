output "database_config" {
  value = var.has_database ? {
    cluster_name       = "${var.app_name}-${var.environment}"
    access_policy_name = "${var.app_name}-${var.environment}-db-access"
    app_username       = "app"
    migrator_username  = "migrator"
    schema_name        = var.app_name
  } : null
}

output "incident_management_service_integration" {
  value = var.has_incident_management_service ? {
    integration_url_param_name = "/monitoring/${var.app_name}/${var.environment}/incident-management-integration-url"
  } : null
}
