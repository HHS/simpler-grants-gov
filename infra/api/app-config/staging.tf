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

  has_opensearch = true
  # https://docs.aws.amazon.com/opensearch-service/latest/developerguide/supported-instance-types.html
  opensearch_dedicated_master_type = "m6g.large.search"
  opensearch_instance_type         = "or1.medium.search"
  # 20 is the minimum volume size for the or1.medium.search instance type.
  opensearch_volume_size = 20
  # https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html#choosing-version
  opensearch_engine_version = "OpenSearch_2.15"

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
