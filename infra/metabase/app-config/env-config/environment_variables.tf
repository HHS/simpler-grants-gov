locals {
  # Map from environment variable name to environment variable value
  # Metabase-specific environment variables
  default_extra_environment_variables = {
    MB_DB_TYPE   = "postgres"
    MB_DB_USER   = "metabaseuser"
    MB_DB_DBNAME = "metabase"
  }

  # Configuration for secrets
  # Metabase needs the database password and New Relic key
  secrets = {
    MB_DB_PASS = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/metabase-db-pass"
    }

    NEW_RELIC_LICENSE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/new-relic-license-key"
    }
  }
}
