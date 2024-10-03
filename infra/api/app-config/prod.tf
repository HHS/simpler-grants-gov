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

  has_opensearch                           = true
  opensearch_multi_az_with_standby_enabled = true
  opensearch_zone_awareness_enabled        = true
  opensearch_dedicated_master_enabled      = true
  opensearch_instance_count                = 3
  opensearch_instance_type                 = "or1.medium.search"
  opensearch_dedicated_master_count        = 3
  opensearch_dedicated_master_type         = "m6g.large.search"
  opensearch_availability_zone_count       = 3

  # See api/src/data_migration/command/load_transform.py for argument specifications.
  load_transform_args = [
    "poetry",
    "run",
    "flask",
    "data-migration",
    "load-transform",
    "--load",
    "--transform",
    "--set-current",
  ]

  service_override_extra_environment_variables = {
  }
}
