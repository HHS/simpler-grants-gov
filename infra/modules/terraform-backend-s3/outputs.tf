output "tf_locks_table_name" {
  description = "Name of the DynamoDB table for state locking (deprecated - use S3 native locking instead)"
  value       = var.enable_dynamodb_lock_table ? aws_dynamodb_table.terraform_lock[0].name : null
}

output "tf_log_bucket_name" {
  value = aws_s3_bucket.tf_log.bucket
}

output "tf_state_bucket_name" {
  value = aws_s3_bucket.tf_state.bucket
}
