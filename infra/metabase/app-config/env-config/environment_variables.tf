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

    # Metabase v64+ secret keys. Both are created manually (openssl rand -base64 32)
    # rather than generated, because the app database must be encrypted with
    # `enable-encryption` before Metabase starts with MB_ENCRYPTION_SECRET_KEY set;
    # Metabase refuses to start otherwise. Losing MB_ENCRYPTION_SECRET_KEY means
    # re-entering every database connection's credentials; changing
    # MB_SESSION_SECRET_KEY signs everyone out.
    # See https://www.metabase.com/docs/latest/databases/encrypting-details-at-rest
    MB_ENCRYPTION_SECRET_KEY = {
      manage_method     = "manual"
      secret_store_name = "/metabase/${var.environment}/encryption-secret-key"
    }

    MB_SESSION_SECRET_KEY = {
      manage_method     = "manual"
      secret_store_name = "/metabase/${var.environment}/session-secret-key"
    }
  }
}
