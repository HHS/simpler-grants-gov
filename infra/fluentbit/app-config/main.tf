locals {
  app_name = regex("/infra/([^/]+)/app-config$", abspath(path.module))[0]
  environments = []
  project_name = module.project_config.project_name

  environment_configs = {}
  account_names_by_environment = {}
  shared_network_name = "dev"
}

module "project_config" {
  source = "../../project-config"
}
