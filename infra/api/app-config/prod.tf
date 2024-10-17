module "prod_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "prod"
  has_database                    = local.has_database
  domain                          = "api.simpler.grants.gov"
  database_instance_count         = 2
  database_enable_http_endpoint   = true
  has_incident_management_service = local.has_incident_management_service
  database_max_capacity           = 32
  database_min_capacity           = 2

  has_search = false
  # https://aws.amazon.com/opensearch-service/pricing/
  search_master_instance_type = "m6g.large.search"
  # 20 is the minimum volume size for the or1.medium.search instance type.
  # Scale the `search_data_volume_size` number to meet your storage needs.
  search_data_instance_type  = "or1.medium.search"
  search_data_volume_size    = 20
  search_data_instance_count = 3
  # Scale this number to meet your compute needs.
  # https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html#choosing-version
  search_engine_version = "OpenSearch_2.15"

  service_override_extra_environment_variables = {
  }
}
