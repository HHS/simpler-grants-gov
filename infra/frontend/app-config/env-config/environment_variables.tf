locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    # see https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#agent-enabled
    NEW_RELIC_ENABLED = "true"
    # see https://github.com/newrelic/node-newrelic?tab=readme-ov-file#setup
    NODE_OPTIONS = "-r newrelic"
    # expose the current AWS Env to the FE Next Node Server at Runtime
    ENVIRONMENT = var.environment
    # https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#labels
    NEW_RELIC_LABELS = "app_name:${var.app_name};environment:${var.environment};service_name:${var.app_name}-${var.environment};serviceName:${var.app_name}-${var.environment};service.name:${var.app_name}-${var.environment};entity.name:${var.app_name}-${var.environment}"
    # https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#logging_config
    NEW_RELIC_LOG_ENABLED = "true"
    NEW_RELIC_LOG         = "stderr"
    # https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#cloud_config
    NEW_RELIC_CLOUD_AWS_ACCOUNT_ID = "315341936575"
    # https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#browser-variables
    NEW_RELIC_BROWSER_MONITORING_ATTRIBUTES_ENABLED = "true"
    # https://docs.newrelic.com/docs/apm/agents/nodejs-agent/installation-configuration/nodejs-agent-configuration/#application-logging-enabled
    # Turned off to avoid duplicate logging, and use logging from fluent bit instead
    NEW_RELIC_APPLICATION_LOGGING_ENABLED = "false"
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
    # Mailchimp API key to pass with requests for newsletter subscriber endpoints.
    MAILCHIMP_API_KEY = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/mailchimp-api-key"
    },
    # Mailchimp data center prefix (e.g. "us4") used to build the API base url.
    MAILCHIMP_API_URL_PREFIX = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/mailchimp-api-url-prefix"
    },
    # Mailchimp list ID for requests to manage subscribers to the Simpler Grants distribution list.
    MAILCHIMP_LIST_ID = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/mailchimp-list-id"
    },
    # URL that the frontend uses to make fetch requests to the Grants API.
    API_URL = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/api-url"
    },
    # URL for the API login route.
    AUTH_LOGIN_URL = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/auth-login-url"
    },
    NEW_RELIC_APP_NAME = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/new-relic-app-name"
    },
    NEW_RELIC_LICENSE_KEY = {
      manage_method     = "manual"
      secret_store_name = "/new-relic-license-key"
    },
    SESSION_SECRET = {
      manage_method     = "generated"
      secret_store_name = "/${var.app_name}/${var.environment}/session-secret"
    },
    FEATURE_APPLY_FORM_PROTOTYPE_OFF = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/feature-apply-form-prototype-off"
    },
    FEATURE_AWARD_RECOMMENDATION_OFF = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/feature-award-recommendation-off"
    },
    FEATURE_MAINTENANCE_MODE = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/feature-maintenance-mode"
    },
    FEATURE_OPPORTUNITIES_LIST_OFF = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/feature-opportunities-list-off"
    },
    FEATURE_FEATURE_FLAG_ADMIN_OFF = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/feature-feature-flag-admin-off"
    },
    API_JWT_PUBLIC_KEY = {
      manage_method     = "manual"
      secret_store_name = "/api/${var.environment}/api-jwt-public-key"
    },
    API_GW_AUTH = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/X-API-KEY"
    },
  }
}
