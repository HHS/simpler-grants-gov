output "role_manager_function_name" {
  value = module.database.role_manager_function_name
}

<<<<<<< before updating
output "opensearch_ingest_policy_arn" {
  description = "The ARN of the IAM policy for OpenSearch ingest operations"
  value       = local.search_config != null ? module.search[0].opensearch_ingest_policy_arn : null
}

output "opensearch_query_policy_arn" {
  description = "The ARN of the IAM policy for OpenSearch query operations"
  value       = local.search_config != null ? module.search[0].opensearch_query_policy_arn : null
=======
output "engine_version" {
  value = module.database.engine_version
>>>>>>> after updating
}
