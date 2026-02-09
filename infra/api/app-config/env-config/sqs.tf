# SQS queue configuration for workflow management
locals {
  sqs_config = {
    queue_name                 = "${var.app_name}-${var.environment}-workflow-management"
    visibility_timeout_seconds = 600
    message_retention_seconds  = 1209600
    max_receive_count          = 3
  }
}
