# analytics service for the infra-grantee2 environment (AWS account 315341936575, network_name "infra-grantee2").
#
# infra-grantee2 mirrors the existing training environment's analytics service +
# database. A few environment-specific settings are deferred for the initial
# bring-up because they don't exist yet in the new account:
#   - HTTPS/custom domains: no ACM certificate
#   - New Relic entity GUIDs: will migrate existing training to it
module "infra_grantee2_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "simpler-grants-gov"
  environment    = "infra-grantee2"
  network_name   = "infra-grantee2"

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-grantee2 analytics RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_instance_count       = 2
  database_min_capacity         = 2
  database_max_capacity         = 2

  service_override_extra_environment_variables = {
    # Mirrors training, which posts results to the #z_bot-sprint-reporting channel in slack
    ACTION = "post-results"
  }
  # Records the intended hostname for this environment; it does not create any DNS
  # or ACM resources on its own (same as infra-dev/infra-staging). The ACM cert lookup
  # is gated on enable_https
  domain_name                     = null  # set once DNS + ACM exist in this env
  enable_https                    = false # No ACM cert / hosted zone in the infra-grantee2 account yet
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  service_cpu                    = 1024
  service_memory                 = 8192
  service_desired_instance_count = 3

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # ⚠️ Warning! It is not recommended to enable this in a production environment.
  # enable_command_execution = true
}
