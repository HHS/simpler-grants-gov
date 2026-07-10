mock_provider "aws" {}

variables {
  name = "test-queue"
}

run "creates_main_queue_with_correct_name" {
  command = plan

  assert {
    condition     = aws_sqs_queue.main.name == var.name
    error_message = "Main queue name should match var.name"
  }
}

run "creates_dlq_with_name_suffix" {
  command = plan

  assert {
    condition     = aws_sqs_queue.dead_letter.name == "${var.name}_dlq"
    error_message = "DLQ name must be var.name + _dlq suffix"
  }
}

run "both_queues_have_sse_enabled" {
  command = plan

  assert {
    condition     = aws_sqs_queue.main.sqs_managed_sse_enabled == true
    error_message = "Main queue must have SSE enabled"
  }

  assert {
    condition     = aws_sqs_queue.dead_letter.sqs_managed_sse_enabled == true
    error_message = "Dead letter queue must have SSE enabled"
  }
}

run "redrive_policy_uses_default_max_receive_count" {
  command = plan

  # Provide a known ARN for the DLQ so redrive_policy is fully resolved at plan time
  override_resource {
    target          = aws_sqs_queue.dead_letter
    override_during = plan
    values = {
      arn = "arn:aws:sqs:us-east-1:123456789012:test-queue_dlq"
    }
  }

  assert {
    condition     = jsondecode(aws_sqs_queue.main.redrive_policy).maxReceiveCount == var.max_receive_count
    error_message = "Default max_receive_count should be 3"
  }
}

run "redrive_policy_respects_custom_max_receive_count" {
  command = plan

  variables {
    max_receive_count = 10
  }

  override_resource {
    target          = aws_sqs_queue.dead_letter
    override_during = plan
    values = {
      arn = "arn:aws:sqs:us-east-1:123456789012:test-queue_dlq"
    }
  }

  assert {
    condition     = jsondecode(aws_sqs_queue.main.redrive_policy).maxReceiveCount == var.max_receive_count
    error_message = "Redrive policy should use the provided max_receive_count"
  }
}

run "output_queue_name_matches_variable" {
  command = plan

  assert {
    condition     = output.queue_name == var.name
    error_message = "Output queue_name should equal var.name"
  }
}
