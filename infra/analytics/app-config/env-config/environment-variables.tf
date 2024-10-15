locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    MB_DB_TYPE   = "postgres"
    MB_DB_USER   = "metabase"
    MB_DB_DBNAME = "metabase"
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
    # Create this in Github
    GH_TOKEN = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/github-token"
    }
    # Create this in Slack
    ANALYTICS_SLACK_BOT_TOKEN = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/slack-bot-token"
    }
    # Retrieve this from Slack
    ANALYTICS_REPORTING_CHANNEL_ID = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/reporting-channel-id"
    }
    # Create this manually in the AWS console via the RDS Query Editor
    #
    # CREATE USER metabase WITH PASSWORD 'REDACTED';
    # CREATE DATABASE metabase OWNER metabase;
    # GRANT ALL PRIVILEGES ON DATABASE metabase TO metabase;
    # GRANT CONNECT ON DATABASE metabase TO metabase;
    # GRANT ALL ON public TO metabase;
    # GRANT ALL ON SCHEMA public TO metabase;
    MB_DB_PASS = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/metabase-db-pass"
    }
  }
}
