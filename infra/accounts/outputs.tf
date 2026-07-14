output "account_id" {
  value = data.aws_caller_identity.current.account_id
}

output "project_name" {
  value = module.project_config.project_name
}

output "region" {
  value = data.aws_region.current.name
}

output "tf_log_bucket_name" {
  value = module.backend.tf_log_bucket_name
}

output "tf_state_bucket_name" {
  value = module.backend.tf_state_bucket_name
}

output "sbom_buckets" {
  description = "Map of environment names to SBOM S3 bucket IDs"
  value = {
    for env in local.sbom_environments :
    env => aws_s3_bucket.sbom[env].id
  }
}

output "sbom_bucket_arns" {
  description = "Map of environment names to SBOM S3 bucket ARNs"
  value = {
    for env in local.sbom_environments :
    env => aws_s3_bucket.sbom[env].arn
  }
}

output "sbom_access_logs_bucket" {
  description = "S3 bucket for SBOM access logs"
  value       = aws_s3_bucket.sbom_access_logs.id
}
