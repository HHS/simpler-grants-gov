locals {
  # app_name is the name of the application, which by convention should match the name of
  # the folder under /infra that corresponds to the application
  app_name = regex("/infra/([^/]+)/app-config$", abspath(path.module))[0]

  # The CMS runs only in staging and prod. To add it to another environment, add an
  # <environment>.tf config here and a matching service backend config file.
  environments = ["staging", "prod"]
  project_name = module.project_config.project_name

  # Drupal's database is not part of this app yet. See
  # https://github.com/HHS/simpler-grants-gov/issues/12863
  has_database = false

  # Drupal has no outbound internet access. Modules and updates are installed when the
  # container image is built (see the CMS sign-in and network access ADR).
  has_external_non_aws_service = false

  environment_configs = {
    staging = module.staging_config
    prod    = module.prod_config
  }

  # Map from environment name to the account name for the AWS account that
  # contains the resources for that environment. Resources that are shared
  # across environments use the key "shared".
  account_names_by_environment = {
    shared  = "simpler-grants-gov"
    staging = "simpler-grants-gov"
    prod    = "simpler-grants-gov"
  }

  # The name of the network that contains the resources shared across all
  # application environments, such as the build repository.
  shared_network_name = "dev"
}

module "project_config" {
  source = "../../project-config"
}
