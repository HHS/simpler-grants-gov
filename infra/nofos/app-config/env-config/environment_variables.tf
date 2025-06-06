locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    DEBUG                = "false"
    DJANGO_ALLOWED_HOSTS = "*"
  }

  secrets = {
    DOCRAPTOR_API_KEY = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/docraptor-api-key"
    }
  }
}
