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

  # Intended domain: data.staging.simpler.grants.gov
  # Enable HTTPS (and set domain_name) once an ACM certificate and a Route53
  # hosted zone exist in the infra-staging account. Until then the service is only
  # reachable over HTTP via the load balancer's AWS-generated DNS name.
  domain_name  = null
  enable_https = false

  service_cpu    = 1024
  service_memory = 4096

  service_desired_instance_count = 1
  instance_scaling_min_capacity  = 1
  instance_scaling_max_capacity  = 2
}
