# analytics service for the infra-staging environment (AWS account 317380566348, network_name "infra-staging").
#
# infra-staging mirrors the existing staging environment's analytics service +
# database. A few environment-specific settings are deferred for the initial
# bring-up because they don't exist yet in the new account:
#   - HTTPS/custom domains: no ACM certificate or Route53 hosted zone yet.
#   - New Relic entity GUIDs: create the infra-staging entities, then fill these in.
module "infra_staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "staging"
  environment    = "infra-staging"
  network_name   = "infra-staging"

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-staging analytics RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_instance_count       = 2
  database_min_capacity         = 2
  database_max_capacity         = 2

  service_override_extra_environment_variables = {
    # Mirrors staging, which posts results to the #z_bot-analytics-ci-test channel in slack
    ACTION = "post-results"
  }
  domain_name                     = "data.staging.simpler.grants.gov"
  enable_https                    = false # No ACM cert / hosted zone in the infra-staging account yet
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  service_cpu    = 256
  service_memory = 2048

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
