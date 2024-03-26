module "dev_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "dev"
  has_database                    = local.has_database
  database_enable_http_endpoint   = true
  has_incident_management_service = local.has_incident_management_service

  service_override_extra_environment_variables = {
    # determines whether the v0.1 endpoints are available in the API
    ENABLE_V_0_1_ENDPOINTS = "true"
  }
}
