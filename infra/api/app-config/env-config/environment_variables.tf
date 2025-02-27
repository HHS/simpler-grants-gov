locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    FLASK_APP = "src.app:create_app()"
    # Example environment variables
    # WORKER_THREADS_COUNT    = 4
    # LOG_LEVEL               = "info"
    # DB_CONNECTION_POOL_SIZE = 5


    # Login.gov OAuth
    # Default values point to the IDP integration environment
    # which all non-prod environments should use
    ENABLE_AUTH_ENDPOINT     = 0
    LOGIN_GOV_CLIENT_ID      = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-${var.environment}-simpler-grants-gov"
    LOGIN_GOV_ENDPOINT       = "https://idp.int.identitysandbox.gov/"
    LOGIN_GOV_JWK_ENDPOINT   = "https://idp.int.identitysandbox.gov/api/openid_connect/certs"
    LOGIN_GOV_AUTH_ENDPOINT  = "https://idp.int.identitysandbox.gov/openid_connect/authorize"
    LOGIN_GOV_TOKEN_ENDPOINT = "https://idp.int.identitysandbox.gov/api/openid_connect/token"
    API_JWT_ISSUER           = "simpler-grants-api-${var.environment}"
    API_JWT_AUDIENCE         = "simpler-grants-api-${var.environment}"
  }

  # Configuration for secrets
  # List of configurations for defining environment variables that pull from SSM parameter
  # store. Configurations are of the format
  # {
  #   ENV_VAR_NAME = {
  #     manage_method     = "generated" # or "manual" for a secret that was created and stored in SSM manually
  #     secret_store_name = "/ssm/param/name"
  #   }
  # }
  secrets = {
    API_AUTH_TOKEN = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/api-auth-token"
    }

    NEW_RELIC_LICENSE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/new-relic-license-key"
    }

    LOGIN_GOV_CLIENT_ASSERTION_PRIVATE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/login-gov-client-assertion-private-key"
    }

    API_JWT_PRIVATE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/api-jwt-private-key"
    }

    API_JWT_PUBLIC_KEY = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/api-jwt-public-key"
    }

    LOGIN_FINAL_DESTINATION = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/frontend-login-redirect-url"
    }
  }
}
