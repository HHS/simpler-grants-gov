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
    # Run this SQL manually in the AWS console via the RDS Query Editor
    # inside of the analytics RDS instance and the `app` database.
    # It creates a "metabase" database that store metabase user configuration,
    # saved queries, dashboards, and other such things. It also grants permission
    # to access the "app" database where the analytics data is stored.
    #
    # You can find the value of < ROOT USER > by running:
    # SELECT username AS role_name FROM pg_catalog.pg_user ORDER BY role_name desc;
    # It is the user that starts with `root`
    #
    #     CREATE ROLE metabaserole;
    #     GRANT metabase TO '< ROOT USER >';                            -- retrieve this from the database
    #     CREATE DATABASE metabase OWNER = '< ROOT USER >';
    #     CREATE USER metabaseuser WITH PASSWORD '< RANDOM PASSWORD >'; -- add this to Parameter Store
    #     GRANT metabaserole TO metabaseuser;
    #
    #     -- the "metabase" database is where metabase configuration is stored, like user logins
    #     GRANT ALL PRIVILEGES ON DATABASE metabase TO metabaseuser;
    #     GRANT CONNECT ON DATABASE metabase TO metabaseuser;
    #
    #     -- the "app" database is where the analytics data is stored
    #     GRANT ALL PRIVILEGES ON DATABASE app TO metabaseuser;
    #     GRANT CONNECT ON DATABASE app TO metabaseuser;
    MB_DB_PASS = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}/${var.environment}/metabase-db-pass"
    }
  }
}
