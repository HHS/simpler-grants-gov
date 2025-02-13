output "app_access_policy_arn" {
  value = data.aws_iam_policy.app_db_access_policy.arn
}

output "app_username" {
  value = module.interface.app_username
}

output "db_name" {
  value = data.aws_rds_cluster.db_cluster.database_name
}

output "host" {
  value = data.aws_rds_cluster.db_cluster.endpoint
}

output "migrator_access_policy_arn" {
  value = data.aws_iam_policy.migrator_db_access_policy.arn
}

output "migrator_username" {
  value = module.interface.migrator_username
}

output "port" {
  value = data.aws_rds_cluster.db_cluster.port
}

output "schema_name" {
  value = module.interface.schema_name
}

output "security_group_ids" {
  value = data.aws_rds_cluster.db_cluster.vpc_security_group_ids
}
