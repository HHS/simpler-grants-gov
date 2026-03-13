module "prod_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "prod"
  network_name                    = "prod"
  domain_name                     = "nofos.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  database_min_capacity   = 1
  database_max_capacity   = 1
  database_instance_count = 1

  service_override_extra_environment_variables = {}
}
