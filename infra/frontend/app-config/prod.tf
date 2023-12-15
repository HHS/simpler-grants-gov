module "prod_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "prod"
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  domain                          = "simpler.grants.gov"
  sendy_api_key                   = "/${local.app_name}/${prod_config.environment}/sendy-api-key"
  sendy_api_url                   = "/${local.app_name}/${prod_config.environment}/sendy-api-url"
  sendy_list_id                   = "/${local.app_name}/${prod_config.environment}/sendy-list-id"
}
