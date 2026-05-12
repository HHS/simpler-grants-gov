output "table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.file_scan_cache.name
}

output "table_arn" {
  description = "The ARN of the DynamoDB table"
  value       = aws_dynamodb_table.file_scan_cache.arn
}

output "table_id" {
  description = "The ID of the DynamoDB table"
  value       = aws_dynamodb_table.file_scan_cache.id
}

output "read_access_policy_arn" {
  description = "The ARN of the IAM policy for read access to the table"
  value       = aws_iam_policy.read_access_policy.arn
}

output "write_access_policy_arn" {
  description = "The ARN of the IAM policy for write access to the table"
  value       = aws_iam_policy.write_access_policy.arn
}
