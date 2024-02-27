module "prod_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "prod"
  has_database                    = local.has_database
  database_instance_count         = 2
  database_enable_http_endpoint   = true
  enable_v01_endpoints            = false
  has_incident_management_service = local.has_incident_management_service
}
