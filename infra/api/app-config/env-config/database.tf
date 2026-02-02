locals {
  database_config = var.has_database ? {
    region                      = var.default_region
    cluster_name                = "${var.app_name}-${var.environment}"
    app_username                = "app"
    migrator_username           = "migrator"
    schema_name                 = "app"
    instance_count              = var.database_instance_count
    max_capacity                = var.database_max_capacity
    enable_http_endpoint        = var.database_enable_http_endpoint
    database_engine_version     = var.database_engine_version
    min_capacity                = var.database_min_capacity
    app_access_policy_name      = "${var.app_name}-${var.environment}-app-access"
    migrator_access_policy_name = "${var.app_name}-${var.environment}-migrator-access"

    # Enable extensions that require the rds_superuser role to be created here
    # See docs/infra/set-up-database.md for more information
    superuser_extensions = {}
  } : null
}
