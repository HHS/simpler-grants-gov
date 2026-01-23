locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    DEBUG = "false"
  }

  secrets = {
    API_TOKEN = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/api-token"
    }

    DJANGO_ALLOWED_HOSTS = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/django-allowed-hosts"
    }

    DOCRAPTOR_API_KEY = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/docraptor-api-key"
    }

    GRABZIT_APPLICATION_KEY = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/grabzit-application-key"
    }

    GRABZIT_SECRET_KEY = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/grabzit-secret-key"
    }

    SECRET_KEY = {
      manage_method     = "manual"
      secret_store_name = "/nofos/${var.environment}/secret-key"
    }
  }
}
