# Metabase service for the infra-staging environment (AWS account 317380566348, network_name "infra-staging").

module "infra_staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-staging"
  network_name   = "infra-staging"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-infra-staging"

  # ALB-only, so this can coexist with staging's until DNS moves.
  domain_name  = "data.staging.simpler.grants.gov"
  enable_https = true

  service_cpu    = 1024
  service_memory = 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
