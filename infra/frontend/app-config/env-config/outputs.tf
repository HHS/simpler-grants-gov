output "database_config" {
  value = var.has_database ? {
    region                      = var.default_region
    cluster_name                = "${var.app_name}-${var.environment}"
    access_policy_name          = "${var.app_name}-${var.environment}-db-access"
    app_username                = "app"
    migrator_username           = "migrator"
    schema_name                 = var.app_name
    app_access_policy_name      = "${var.app_name}-${var.environment}-app-access"
    migrator_access_policy_name = "${var.app_name}-${var.environment}-migrator-access"
  } : null
}

output "service_config" {
  value = {
    region = var.default_region
  }
}

output "incident_management_service_integration" {
  value = var.has_incident_management_service ? {
    integration_url_param_name = "/monitoring/${var.app_name}/${var.environment}/incident-management-integration-url"
  } : null
}

output "domain" {
  value = var.domain
}

output "sendy_api_key" {
  value = var.sendy_api_key
  sensitive = true
}

output "sendy_api_url" {
  value = var.sendy_api_url
}

output "sendy_list_id" {
  value = var.sendy_list_id
}
