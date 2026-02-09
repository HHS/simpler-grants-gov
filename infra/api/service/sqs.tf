locals {
  sqs_config = local.environment_config.sqs_config
  sqs_environment_variables = {
    WORKFLOW_SQS_QUEUE = module.sqs_queue.queue_name
  }
}

module "sqs_queue" {
  source = "../../modules/sqs-queue"

  name                       = "${local.prefix}${local.sqs_config.queue_name}"
  visibility_timeout_seconds = local.sqs_config.visibility_timeout_seconds
  message_retention_seconds  = local.sqs_config.message_retention_seconds
  max_receive_count          = local.sqs_config.max_receive_count
}
