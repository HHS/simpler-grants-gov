module "prod_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "prod"
  network_name   = "prod"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-prod"

  domain_name  = "data.simpler.grants.gov" # Match existing ACM certificate
  enable_https = true

  # Full resources for production
  service_cpu    = 2048
  service_memory = 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 3
}
