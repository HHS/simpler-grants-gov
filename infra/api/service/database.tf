locals {
  database_config = local.environment_config.database_config
}

module "database" {
  count  = module.app_config.has_database ? 1 : 0
  source = "../../modules/database/data"
  name   = local.database_config.cluster_name
}
