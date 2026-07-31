# Metabase service for the infra-grantor1 environment (AWS account 315341936575, network_name "infra-grantor1").


module "infra_grantor1_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-grantor1"
  network_name   = "infra-grantor1"

  # Analytics database that Metabase connects to. Must match the cluster name the
  # analytics database module creates for this environment, which is
  # "${app_name}-${environment}" (see analytics/app-config/env-config/database.tf).
  analytics_database_cluster_name = "analytics-infra-grantor1"

  domain_name  = null
  enable_https = false

  # Same as the existing training environment
  service_cpu    = 1024
  service_memory = 2048

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
