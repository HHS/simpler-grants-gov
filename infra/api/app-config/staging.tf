module "staging_config" {
  source                          = "./env-config"
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "staging"
  has_database                    = local.has_database
  database_instance_count         = 2
  database_enable_http_endpoint   = true
  has_incident_management_service = local.has_incident_management_service
  database_max_capacity           = 16
  database_min_capacity           = 2

  has_opensearch                           = true
  opensearch_multi_az_with_standby_enabled = false
  opensearch_zone_awareness_enabled        = false
  opensearch_dedicated_master_enabled      = false
  opensearch_dedicated_master_count        = 1
  opensearch_dedicated_master_type         = "m6g.large.search" # 0.128/hour = 92/month
  opensearch_instance_count                = 1
  opensearch_instance_type                 = "or1.medium.search" # 0.105/hour = 76/month
  opensearch_availability_zone_count       = 3
  # total = 168/month

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
