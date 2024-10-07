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

  has_opensearch                   = true
  opensearch_instance_type         = "or1.medium.search"
  opensearch_dedicated_master_type = "m6g.large.search"
  opensearch_engine_version        = "OpenSearch_2.15"
  opensearch_volume_size           = 20

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
