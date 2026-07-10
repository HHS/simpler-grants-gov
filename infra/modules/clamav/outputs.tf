output "scanner_function_name" {
  description = "Name of the scanner Lambda."
  value       = aws_lambda_function.scanner.function_name
}

output "scanner_function_arn" {
  description = "ARN of the scanner Lambda."
  value       = aws_lambda_function.scanner.arn
}

output "freshclam_function_name" {
  description = "Name of the freshclam Lambda."
  value       = aws_lambda_function.freshclam.function_name
}

output "freshclam_function_arn" {
  description = "ARN of the freshclam Lambda."
  value       = aws_lambda_function.freshclam.arn
}

output "efs_file_system_id" {
  description = "ID of the EFS file system holding the signature database."
  value       = aws_efs_file_system.clamav.id
}

output "efs_access_point_arn" {
  description = "ARN of the EFS access point both Lambdas mount."
  value       = aws_efs_access_point.clamav.arn
}

output "layer_arn" {
  description = "ARN of the ClamAV binaries Lambda layer."
  value       = aws_lambda_layer_version.clamav.arn
}

output "scanner_dlq_arn" {
  description = "ARN of the SQS dead-letter queue for failed scanner invocations."
  value       = aws_sqs_queue.scanner_dlq.arn
}

output "scanner_dlq_url" {
  description = "URL of the SQS dead-letter queue for failed scanner invocations."
  value       = aws_sqs_queue.scanner_dlq.url
}

output "scanner_dlq_name" {
  description = "Name of the SQS dead-letter queue for failed scanner invocations."
  value       = aws_sqs_queue.scanner_dlq.name
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for ClamAV operational alerts (infected files, freshclam failures, DLQ buildup)."
  value       = aws_sns_topic.alerts.arn
}
