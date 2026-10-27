mock_provider "aws" {
  mock_data "aws_ssm_parameter" {
    defaults = {
      type  = "SecureString"
      value = " synthetic-alerts@example.com "
    }
  }
}

variables {
  service_name             = "nofos-infra-dev"
  load_balancer_arn_suffix = "app/nofos-infra-dev/synthetic"
  application_log_group    = "service/nofos-infra-dev"
  pdf_readability_monitoring = {
    waf_metric_name = "nofos-infra-dev-waf"
    cluster_name    = "nofos-infra-dev"
    region          = "us-east-1"
  }
}

run "private_route_is_absent_by_default" {
  command = plan
  assert {
    condition     = length(data.aws_ssm_parameter.private_alert_email) == 0 && length(aws_sns_topic_subscription.private_email_integration) == 0
    error_message = "Default callers must neither read SSM nor create private subscriptions."
  }
}

run "secure_parameter_creates_one_sensitive_email_subscription" {
  command = plan
  variables {
    email_alert_recipient_parameter_name = "/synthetic/monitoring/email"
  }
  assert {
    condition     = length(aws_sns_topic_subscription.private_email_integration) == 1 && length(aws_sns_topic_subscription.email_integration) == 0
    error_message = "Use a stable private resource identity, never an email-address resource key."
  }
  assert {
    condition     = aws_sns_topic_subscription.private_email_integration[0].protocol == "email" && aws_sns_topic_subscription.private_email_integration[0].endpoint == "synthetic-alerts@example.com" && issensitive(aws_sns_topic_subscription.private_email_integration[0].endpoint)
    error_message = "The trimmed private address must stay sensitive in Terraform plans."
  }
  assert {
    condition     = alltrue([for a in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : !a.actions_enabled]) && alltrue([for a in aws_cloudwatch_metric_alarm.pdf_readability_utilization : !a.actions_enabled])
    error_message = "Subscribing an address must not activate the calculator alarm actions."
  }
}

run "private_destination_allows_explicit_alarm_activation" {
  command = plan
  variables {
    email_alert_recipient_parameter_name  = "/synthetic/monitoring/email"
    pdf_readability_alarm_actions_enabled = true
  }
  assert {
    condition     = alltrue([for a in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : a.actions_enabled && length(a.ok_actions) == 1])
    error_message = "Explicit activation must retain alarm and recovery routing. Confirmation/delivery still need live verification."
  }
}

run "private_route_still_requires_monitoring_for_alarm_activation" {
  command = plan
  variables {
    email_alert_recipient_parameter_name  = "/synthetic/monitoring/email"
    pdf_readability_monitoring            = null
    pdf_readability_alarm_actions_enabled = true
  }
  expect_failures = [var.pdf_readability_alarm_actions_enabled]
}

run "reject_mixed_public_and_private_routes" {
  command = plan
  variables {
    email_alert_recipient_parameter_name = "/synthetic/monitoring/email"
    email_alert_recipients               = ["public@example.com"]
  }
  expect_failures = [var.email_alert_recipient_parameter_name]
}

run "reject_invalid_parameter_path" {
  command = plan
  variables {
    email_alert_recipient_parameter_name = "not-an-absolute-path"
  }
  expect_failures = [var.email_alert_recipient_parameter_name]
}

run "reject_plaintext_parameter" {
  command = plan
  variables {
    email_alert_recipient_parameter_name = "/synthetic/monitoring/email"
  }
  override_data {
    target = data.aws_ssm_parameter.private_alert_email[0]
    values = { type = "String", value = "synthetic-alerts@example.com" }
  }
  expect_failures = [aws_sns_topic_subscription.private_email_integration]
}

run "reject_non_email_parameter" {
  command = plan
  variables {
    email_alert_recipient_parameter_name = "/synthetic/monitoring/email"
  }
  override_data {
    target = data.aws_ssm_parameter.private_alert_email[0]
    values = { type = "SecureString", value = "not an email" }
  }
  expect_failures = [aws_sns_topic_subscription.private_email_integration]
}
