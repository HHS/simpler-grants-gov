module "training_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "training"
  network_name                    = "training"
  domain_name                     = "nofos.training.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications
  enable_identity_provider        = local.enable_identity_provider

  database_engine_version = "17.5"
  database_min_capacity   = 1
  database_max_capacity   = 1
  database_instance_count = 1

  service_override_extra_environment_variables = {}
}
