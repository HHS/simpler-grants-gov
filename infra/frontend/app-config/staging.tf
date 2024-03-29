module "staging_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "staging"
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  domain                          = "beta.grants.gov"
}
