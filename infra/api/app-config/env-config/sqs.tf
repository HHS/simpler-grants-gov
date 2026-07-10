# SQS queue configuration for workflow management
locals {
  sqs_config = {
    queue_name                 = "${var.app_name}-${var.environment}-workflow-management"
    visibility_timeout_seconds = var.sqs_visibility_timeout_seconds
    message_retention_seconds  = var.sqs_message_retention_seconds
    max_receive_count          = var.sqs_max_receive_count
  }
}
