module "prod_config" {
  source                  = "./env-config"
  app_name                = local.app_name
  default_region          = module.project_config.default_region
  environment             = "prod"
  database_instance_count = 2
}
