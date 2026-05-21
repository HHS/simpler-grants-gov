module "grantee1_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "grantee1"
  network_name   = "prod"

  # Analytics database that Metabase connects to
  analytics_database_cluster_name = "analytics-grantee1"

  domain_name  = "metabase.grantee1.simpler.grants.gov"
  enable_https = true

  # Similar to prod
  service_cpu    = 2048
  service_memory = 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
