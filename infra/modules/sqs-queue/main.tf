# Dead letter queue for messages that fail processing
resource "aws_sqs_queue" "dead_letter" {
  name                      = "${var.name}_dlq"
  message_retention_seconds = var.message_retention_seconds
  sqs_managed_sse_enabled   = true

  tags = {
    name = "${var.name}_dlq"
  }
}

# Main queue with dead letter queue redrive policy
resource "aws_sqs_queue" "main" {
  name                       = var.name
  visibility_timeout_seconds = var.visibility_timeout_seconds
  message_retention_seconds  = var.message_retention_seconds
  sqs_managed_sse_enabled    = true

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dead_letter.arn
    maxReceiveCount     = var.max_receive_count
  })

  tags = {
    name = var.name
  }
}

# Allow the dead letter queue to receive messages from the main queue
resource "aws_sqs_queue_redrive_allow_policy" "dead_letter" {
  queue_url = aws_sqs_queue.dead_letter.id

  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.main.arn]
  })
}

# IAM policy for sending and receiving messages from the queue
data "aws_iam_policy_document" "access_policy" {
  statement {
    sid    = "AllowSQSAccess"
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl",
    ]
    resources = [
      aws_sqs_queue.main.arn,
    ]
  }
}

resource "aws_iam_policy" "access_policy" {
  name   = "${var.name}-access"
  policy = data.aws_iam_policy_document.access_policy.json

  tags = {
    name = "${var.name}-access"
  }
}
