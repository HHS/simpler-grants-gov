module "dev_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "dev"
  network_name   = "dev"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-dev"

  domain_name  = "data.dev.simpler.grants.gov" # Match naming convention (cert expired, will need renewal)
  enable_https = true                          # Certificate expired - needs to be renewed before enabling HTTPS

  # When we set memory at 1024 metabase is intermittently running into oom.
  # The recommend min config for memory is at 2GB
  service_cpu    = 1024
  service_memory = 2048

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 1 # No autoscaling in dev

  # Uncomment to enable ECS Exec for debugging
  # enable_command_execution = true
}
