# nofos service for the infra-dev environment (AWS account 061664787759, network_name "infra-dev-simpler-grants").
#
# infra-dev mirrors the existing dev environment's nofos service + database.
# A few environment-specific settings are deferred for the initial bring-up
# because they don't exist yet in the new account:
#   - HTTPS/custom domains: no ACM certificate or Route53 hosted zone yet.
#   - New Relic entity GUIDs: create the infra-dev entities, then fill these in.
module "infra_dev_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-dev"
  network_name                    = "infra-dev-simpler-grants"
  domain_name                     = "nofos.dev.simpler.grants.gov"
  enable_https                    = false # No ACM cert / hosted zone in the infra-dev account yet
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications
  enable_identity_provider        = local.enable_identity_provider

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-dev nofos RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_min_capacity         = 1
  database_max_capacity         = 1
  database_instance_count       = 1

  service_override_extra_environment_variables = {}
}
