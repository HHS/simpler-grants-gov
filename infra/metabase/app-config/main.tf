locals {
  # app_name is the name of the application, which by convention should match the name of
  # the folder under /infra that corresponds to the application
  app_name = regex("/infra/([^/]+)/app-config$", abspath(path.module))[0]

  environments = ["dev", "staging", "prod", "training", "grantee1"]
  project_name = module.project_config.project_name

  # Metabase uses the analytics database instead of its own
  # Set has_database to false since we don't create database resources here
  has_database = false

  # Metabase is a standalone service that doesn't depend on external non-AWS services
  # But it may need NAT gateway access if New Relic integration is enabled
  has_external_non_aws_service = true

  has_incident_management_service = false
  enable_identity_provider        = false
  enable_notifications            = false
  enable_waf                      = false

  environment_configs = {
    dev      = module.dev_config
    staging  = module.staging_config
    prod     = module.prod_config
    training = module.training_config
    grantee1 = module.grantee1_config
  }

  # Map from environment name to the account name for the AWS account that
  # contains the resources for that environment
  account_names_by_environment = {
    shared   = "simpler-grants-gov"
    dev      = "simpler-grants-gov"
    staging  = "simpler-grants-gov"
    prod     = "simpler-grants-gov"
    training = "simpler-grants-gov"
    grantee1 = "simpler-grants-gov"
  }

  # Use the same shared network as analytics since metabase shares its database
  shared_network_name = "prod"
}

module "project_config" {
  source = "../../project-config"
}
