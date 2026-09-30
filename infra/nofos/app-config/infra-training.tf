# nofos service for the infra-training environment (AWS account 049145893907, network_name "infra-training").

module "infra_training_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-training"
  network_name                    = "infra-training"
  domain_name                     = "nofos.training.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications
  enable_identity_provider        = local.enable_identity_provider

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-training nofos RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_min_capacity         = 1
  database_max_capacity         = 1
  database_instance_count       = 1

  service_override_extra_environment_variables = {}
}
