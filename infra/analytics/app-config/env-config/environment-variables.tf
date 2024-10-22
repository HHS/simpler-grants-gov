locals {
  # Map from environment variable name to environment variable value
  # This is a map rather than a list so that variables can be easily
  # overridden per environment using terraform's `merge` function
  default_extra_environment_variables = {
    MB_DB_TYPE   = "postgres"
    MB_DB_USER   = "metabaseuser"
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
    #
    # Create this manually in the AWS console via the RDS Query Editor
    # inside of the analytics RDS instance and the `app` database.
    #
    # This database is configured by Metabase on application startup.
    #
    # You can find the value of < ROOT USER > by running:
    # SELECT usename AS role_name FROM pg_catalog.pg_user ORDER BY role_name desc;
    # It is the user that starts with `root`
    #
    # CREATE ROLE metabaserole;
    # GRANT metabase TO '< ROOT USER >';                            -- retrieve this from the database
    # CREATE DATABASE metabase OWNER = '< ROOT USER >';
    # CREATE USER metabaseuser WITH PASSWORD '< RANDOM PASSWORD >'; -- add this to Parameter Store
    # GRANT ALL PRIVILEGES ON DATABASE metabase TO metabaseuser;
    # GRANT CONNECT ON DATABASE metabase TO metabaseuser;
    # GRANT metabaserole TO metabaseuser;
    #
    MB_DB_PASS = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/metabase-db-pass"
    },
    #
    # Create this manually in the AWS console via the RDS Query Editor
    # inside of the API RDS instance and the `app` database.
    #
    # This database is configured inside of the Metabase UI.
    # Which is to say, this environment variable is not used by Metabase directly.
    # It's being added here for documentation purposes, as it is
    # configured in a similar way to the Metabase analytics database.
    #
    # CREATE ROLE metabaserole;
    # CREATE USER metabaseuser WITH PASSWORD '< RANDOM PASSWORD >'; -- add this to Parameter Store
    # GRANT ALL PRIVILEGES ON DATABASE app TO metabaseuser;
    # GRANT CONNECT ON DATABASE app TO metabaseuser;
    # GRANT metabaserole TO metabaseuser;
    #
    # API_DB_PASS = {
    #   manage_method     = "manual"
    #   secret_store_name = "/${var.app_name}/${var.environment}/metabase-api-db-pass"
    # }
  }
}
