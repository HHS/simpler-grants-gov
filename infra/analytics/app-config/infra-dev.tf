# analytics service for the infra-dev environment (AWS account 061664787759, network_name "infra-dev-simpler-grants").
#
# infra-dev mirrors the existing dev environment's analytics service + database.
# A few environment-specific settings are deferred for the initial bring-up
# because they don't exist yet in the new account:
#   - HTTPS/custom domains: no ACM certificate or Route53 hosted zone yet.
#   - New Relic entity GUIDs: create the infra-dev entities, then fill these in.
module "infra_dev_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "dev"
  environment    = "infra-dev"
  network_name   = "infra-dev-simpler-grants"

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-dev analytics RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_instance_count       = 2
  database_min_capacity         = 2
  database_max_capacity         = 2

  service_override_extra_environment_variables = {
    # In dev, only show the results in the AWS console
    ACTION = "show-results"
  }
  domain_name                     = "data.dev.simpler.grants.gov"
  enable_https                    = false # No ACM cert / hosted zone in the infra-dev account yet
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications

  service_cpu    = 256
  service_memory = 2048

  enable_identity_provider = local.enable_identity_provider

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
