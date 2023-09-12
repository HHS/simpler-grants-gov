locals {
  app_name                        = "api"
  environments                    = ["dev", "prod"]
  project_name                    = module.project_config.project_name
  image_repository_name           = "${local.project_name}-${local.app_name}"
  has_database                    = true
  has_incident_management_service = false

  environment_configs = { for environment in local.environments : environment => module.env_config[environment] }

  build_repository_config = {
    region = module.project_config.default_region
  }
  # Map from environment name to the account name for the AWS account that
  # contains the resources for that environment. Resources that are shared
  # across environments use the key "shared".
  # The list of configured AWS accounts can be found in /infra/account
  # by looking for the backend config files of the form:
  #   <ACCOUNT_NAME>.<ACCOUNT_ID>.s3.tfbackend
  #
  # Projects/applications that use the same AWS account for all environments
  # will refer to the same account for all environments. For example, if the
  # project has a single account named "myaccount", then infra/accounts will
  # have one tfbackend file myaccount.XXXXX.s3.tfbackend, and the
  # account_names_by_environment map will look like:
  #
  #   account_names_by_environment = {
  #     shared  = "myaccount"
  #     dev     = "myaccount"
  #     staging = "myaccount"
  #     prod    = "myaccount"
  #   }
  #
  # Projects/applications that have separate AWS accounts for each environment
  # might have a map that looks more like this:
  #
  #   account_names_by_environment = {
  #     shared  = "dev"
  #     dev     = "dev"
  #     staging = "staging"
  #     prod    = "prod"
  #   }
  account_names_by_environment = {
    shared = "grants-equity"
    dev    = "grants-equity"
    prod   = "grants-equity"
  }
}

module "project_config" {
  source = "../../project-config"
}

module "env_config" {
  for_each = toset(local.environments)

  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = each.key
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
}
