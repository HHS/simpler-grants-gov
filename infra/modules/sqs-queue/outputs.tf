output "queue_url" {
  description = "The URL for the created Amazon SQS queue"
  value       = aws_sqs_queue.main.url
}

output "queue_arn" {
  description = "The ARN for the created Amazon SQS queue"
  value       = aws_sqs_queue.main.arn
}

output "queue_name" {
  description = "The name of the created Amazon SQS queue"
  value       = aws_sqs_queue.main.name
}

output "dead_letter_queue_url" {
  description = "The URL for the dead letter queue"
  value       = aws_sqs_queue.dead_letter.url
}

output "dead_letter_queue_arn" {
  description = "The ARN for the dead letter queue"
  value       = aws_sqs_queue.dead_letter.arn
}

output "access_policy_arn" {
  description = "The ARN of the IAM policy for accessing the queue"
  value       = aws_iam_policy.access_policy.arn
}
