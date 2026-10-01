# frontend service for the infra-staging environment (AWS account 317380566348, network_name "infra-staging").
#
# Mirrors the existing staging frontend. staging releases this CDN alias first (see staging.tf).
module "infra_staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-staging"
  network_name   = "infra-staging"

  app_environment_name = "staging"

  domain_name                     = "staging.simpler.grants.gov"
  enable_cdn_alias                = true
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  # Sizing mirrors staging.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_memory                 = 2048
  instance_cpu                    = 1024
  instance_scaling_max_capacity   = 10

  service_newrelic_entity_guid      = "NTI0OTgwOXxJTkZSQXxOQXwtMzk5MDMyNzAyMjU0NzE5MzQ4Mw"
  service_host_newrelic_entity_guid = "NTI0OTgwOXxCUk9XU0VSfEFQUExJQ0FUSU9OfDExMjAzNzk0NTc"

  # Enables ECS Exec access for debugging or jump access.
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
