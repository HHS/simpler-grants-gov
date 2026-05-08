mock_provider "aws" {}

variables {
  service_name             = "my-service"
  load_balancer_arn_suffix = "app/my-service/abc123def456"
}

run "sns_topic_name_uses_service_name" {
  command = plan

  assert {
    condition     = aws_sns_topic.this.name == "${var.service_name}-monitoring"
    error_message = "SNS topic name should be {service_name}-monitoring"
  }
}

run "cloudwatch_alarms_include_service_name" {
  command = plan

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_app_http_5xx_count.alarm_name == "${var.service_name}-high-app-5xx-count"
    error_message = "App 5XX alarm name must include service name"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_load_balancer_http_5xx_count.alarm_name == "${var.service_name}-high-load-balancer-5xx-count"
    error_message = "LB 5XX alarm name must include service name"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.high_app_response_time.alarm_name == "${var.service_name}-high-app-response-time"
    error_message = "Response time alarm name must include service name"
  }

  assert {
    condition     = aws_cloudwatch_metric_alarm.service_errors.alarm_name == "${var.service_name}-errors"
    error_message = "Service errors alarm name must include service name"
  }
}

run "no_email_subscriptions_by_default" {
  command = plan

  assert {
    condition     = length(aws_sns_topic_subscription.email_integration) == 0
    error_message = "No email subscriptions should be created when email_alert_recipients is empty"
  }
}

run "creates_one_email_subscription_per_recipient" {
  command = plan

  variables {
    email_alert_recipients = ["alice@example.com", "bob@example.com"]
  }

  assert {
    condition     = length(aws_sns_topic_subscription.email_integration) == length(var.email_alert_recipients)
    error_message = "One subscription should be created per email recipient"
  }
}

run "no_incident_management_subscription_by_default" {
  command = plan

  assert {
    condition     = length(aws_sns_topic_subscription.incident_management_service_integration) == 0
    error_message = "No incident management subscription by default"
  }
}

run "creates_incident_management_subscription_when_url_provided" {
  command = plan

  variables {
    incident_management_service_integration_url = "https://events.pagerduty.com/integration/abc123/enqueue"
  }

  assert {
    condition     = length(aws_sns_topic_subscription.incident_management_service_integration) == 1
    error_message = "One incident management subscription should be created when URL is provided"
  }
}
