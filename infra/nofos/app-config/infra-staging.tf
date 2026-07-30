# nofos service for the infra-staging environment (AWS account 317380566348, network_name "infra-staging").
#
# infra-staging mirrors the existing staging environment's nofos service + database.
# Staging has no nofos domain either, so there is nothing deferred on DNS here; the
# New Relic entity GUID still needs creating in the new account.
module "infra_staging_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-staging"
  network_name                    = "infra-staging"
  domain_name                     = null
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications
  enable_identity_provider        = local.enable_identity_provider

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-staging nofos RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_min_capacity         = 1
  database_max_capacity         = 1
  database_instance_count       = 1

  service_override_extra_environment_variables = {}
}
