output "app_name" {
  value = local.app_name
}

output "account_names_by_environment" {
  value = local.account_names_by_environment
}

output "image_repository_name" {
  value = local.image_repository_name
}

output "build_repository_config" {
  value = local.build_repository_config
}

output "environment_configs" {
  value = local.environment_configs
}

# This variable is slightly misnamed. It should really be called "has_migrations".
# It controls whether or not the `run-database-migrations.sh` script tries to run database
# migrations. The entire analytics application is going to have its schema controlled
# via ETL jobs, so we don't need to run migrations in the same way as the API.
output "has_database" {
  value = false
}
