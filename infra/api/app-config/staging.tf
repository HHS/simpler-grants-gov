module "staging_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "staging"
  has_database                    = local.has_database
  database_enable_http_endpoint   = true
  enable_v01_endpoints            = true
  has_incident_management_service = local.has_incident_management_service

  service_override_extra_environment_variables = {
    ENABLE_V_0_1_ENDPOINTS = "true"
  }
}
