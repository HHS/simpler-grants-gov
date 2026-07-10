locals {
  database_config = local.environment_config.database_config
}

# Metabase doesn't create its own database (has_database = false), but it does connect to
# the existing analytics database. This read-only data module looks up that cluster and its
# IAM access policies so the service can be granted network + IAM access to it. It is not
# gated on has_database because Metabase always connects to the existing analytics cluster.
module "database" {
  source = "../../modules/database/data"
  name   = local.database_config.cluster_name
}
