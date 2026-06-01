module "staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "staging"
  network_name   = "staging"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-staging"

  domain_name  = "data.staging.simpler.grants.gov" # Match existing ACM certificate
  enable_https = true

  # Scaled down resources for staging environment (Issue #10239)
  service_cpu    = 1024 # Down from 2048
  service_memory = 2048 # Down from 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
