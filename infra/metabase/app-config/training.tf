module "training_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "training"
  network_name   = "training"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-training"

  domain_name  = "data.training.simpler.grants.gov" # Match existing ACM certificate
  enable_https = true

  # Similar to staging
  service_cpu    = 1024
  service_memory = 2048

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
