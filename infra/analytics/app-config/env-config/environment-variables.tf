locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    # Example environment variables
    # WORKER_THREADS_COUNT    = 4
    # LOG_LEVEL               = "info"
    # DB_CONNECTION_POOL_SIZE = 5
  }

  # Configuration for secrets
  # List of configurations for defining environment variables that pull from SSM parameter
  # store. Configurations are of the format
  # { name = "ENV_VAR_NAME", ssm_param_name = "/ssm/param/name" }
  secrets = [
    {
      name           = "GH_TOKEN"
      ssm_param_name = "/${var.app_name}/${var.environment}/github-token"
    },
    {
      name           = "ANALYTICS_SLACK_BOT_TOKEN"
      ssm_param_name = "/${var.app_name}/${var.environment}/slack-bot-token"
    },
    {
      name           = "ANALYTICS_REPORTING_CHANNEL_ID"
      ssm_param_name = "/${var.app_name}/${var.environment}/reporting-channel-id"
    }
  ]
}
