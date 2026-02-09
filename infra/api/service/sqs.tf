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

# Resource-based policy to restrict SQS queue access to only the API service role
data "aws_iam_policy_document" "sqs_queue_policy" {
  statement {
    sid    = "AllowAPIServiceAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [module.service.app_service_arn]
    }
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = [module.sqs_queue.queue_arn]
  }
}

resource "aws_sqs_queue_policy" "main" {
  queue_url = module.sqs_queue.queue_url
  policy    = data.aws_iam_policy_document.sqs_queue_policy.json
}

# Resource-based policy for the dead letter queue
data "aws_iam_policy_document" "sqs_dlq_policy" {
  statement {
    sid    = "AllowAPIServiceAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [module.service.app_service_arn]
    }
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = [module.sqs_queue.dead_letter_queue_arn]
  }
}

resource "aws_sqs_queue_policy" "dead_letter" {
  queue_url = module.sqs_queue.dead_letter_queue_url
  policy    = data.aws_iam_policy_document.sqs_dlq_policy.json
}
