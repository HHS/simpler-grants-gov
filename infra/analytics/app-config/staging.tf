module "staging_config" {
  source         = "./env-config"
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "staging"
}
