module "prod_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "prod"
  network_name   = "prod"
  domain_name    = null
  enable_https   = false

  instance_desired_instance_count = 1
  instance_scaling_min_capacity   = 1
  instance_scaling_max_capacity   = 1

  database_min_capacity   = 1
  database_max_capacity   = 1
  database_instance_count = 1

  service_override_extra_environment_variables = {}
}
