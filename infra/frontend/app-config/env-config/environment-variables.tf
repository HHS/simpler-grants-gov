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
      # Sendy API key to pass with requests for sendy subscriber endpoints.
      name           = "SENDY_API_KEY"
      ssm_param_name = "/${var.app_name}/${var.environment}/sendy-api-key"
    },
    {
      # Sendy API base url for requests to manage subscribers.
      name           = "SENDY_API_URL"
      ssm_param_name = "/${var.app_name}/${var.environment}/sendy-api-url"
    },
    {
      # Sendy list ID to for requests to manage subscribers to the Simpler Grants distribution list.
      name           = "SENDY_LIST_ID"
      ssm_param_name = "/${var.app_name}/${var.environment}/sendy-list-id"
    },
    {
      # URL that the frontend uses to make fetch requests to the API.
      name           = "API_URL"
      ssm_param_name = "/${var.app_name}/${var.environment}/api-url"
    },
    {
      # Token that the frontend uses to authenticate when making Grants API fetch requests.
      name           = "API_AUTH_TOKEN"
      ssm_param_name = "/${var.app_name}/${var.environment}/api-auth-token"
    }
  ]
}
