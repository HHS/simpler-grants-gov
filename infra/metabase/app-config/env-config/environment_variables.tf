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
  # NOTE: Secrets are still stored at /analytics/{env}/* for backward compatibility
  # TODO: Migrate secrets to /metabase/{env}/* in the future
  secrets = {
    MB_DB_PASS = {
      manage_method     = "manual"
      secret_store_name = "/analytics/${var.environment}/metabase-db-pass"
    }

    NEW_RELIC_LICENSE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/analytics/${var.environment}/new-relic-license-key"
    }
  }
}
