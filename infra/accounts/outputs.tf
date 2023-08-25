output "project_name" {
  value = module.project_config.project_name
}

output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "region" {
  value = data.aws_region.current.name
}

output "tf_state_bucket_name" {
  value = module.backend.tf_state_bucket_name
}

output "tf_log_bucket_name" {
  value = module.backend.tf_log_bucket_name
}

output "tf_locks_table_name" {
  value = module.backend.tf_locks_table_name
}
