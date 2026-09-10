# Metabase service for the infra-dev environment (AWS account 061664787759, network_name "infra-dev-simpler-grants").

module "infra_dev_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-dev"
  network_name   = "infra-dev-simpler-grants"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-infra-dev"

  domain_name  = "data.dev.simpler.grants.gov"
  enable_https = true

  # When we set memory at 1024 and 2048 metabase is intermittently running into oom.
  service_cpu    = 1024
  service_memory = 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 1 # No autoscaling in infra-dev

  # Uncomment to enable ECS Exec for debugging
  # enable_command_execution = true
}
