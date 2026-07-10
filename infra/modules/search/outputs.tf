output "endpoint" {
  value = aws_opensearch_domain.opensearch.endpoint
}

output "domain_arn" {
  description = "The ARN of the OpenSearch domain"
  value       = aws_opensearch_domain.opensearch.arn
}

output "opensearch_ingest_policy_arn" {
  description = "The ARN of the IAM policy for ingest operations"
  value       = aws_iam_policy.opensearch_ingest.arn
}

output "opensearch_query_policy_arn" {
  description = "The ARN of the IAM policy for query operations"
  value       = aws_iam_policy.opensearch_query.arn
}
