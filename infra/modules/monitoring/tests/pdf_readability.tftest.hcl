mock_provider "aws" {}

variables {
  service_name             = "nofos-infra-dev"
  load_balancer_arn_suffix = "app/nofos-infra-dev/abc123"
  application_log_group    = "service/nofos-infra-dev"
  pdf_readability_monitoring = {
    waf_metric_name = "nofos-infra-dev-waf"
    cluster_name    = "nofos-infra-dev"
    region          = "us-east-1"
  }
}

run "default_does_not_add_monitoring_to_other_services" {
  command = plan
  variables {
    service_name               = "frontend-dev"
    pdf_readability_monitoring = null
  }
  assert {
    condition     = length(aws_cloudwatch_dashboard.pdf_readability) == 0 && length(aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks) == 0 && length(aws_cloudwatch_metric_alarm.pdf_readability_utilization) == 0
    error_message = "Null must add no pilot dashboard or alarms."
  }
  assert {
    condition     = output.pdf_readability_dashboard_name == null && length(aws_sns_topic_subscription.email_integration) == 0
    error_message = "Default must expose no dashboard and create no subscriptions."
  }
}

run "dev_dashboard_and_alarms_start_without_notifications" {
  command = plan
  assert {
    condition     = length(aws_cloudwatch_dashboard.pdf_readability) == 1 && length(aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks) == 2 && length(aws_cloudwatch_metric_alarm.pdf_readability_utilization) == 2
    error_message = "Opt-in must create one dashboard and four alarms."
  }
  assert {
    condition     = alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : !alarm.actions_enabled]) && alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_utilization : !alarm.actions_enabled])
    error_message = "Pilot notifications must be disabled by default."
  }
  assert {
    condition     = length(aws_sns_topic_subscription.email_integration) == 0 && length(aws_sns_topic_subscription.incident_management_service_integration) == 0
    error_message = "Opt-in must not invent an alert destination or subscription."
  }
  assert {
    condition     = output.pdf_readability_dashboard_name == "nofos-infra-dev-pdf-readability"
    error_message = "Dashboard name must identify the NOFO environment."
  }
}

run "waf_alarms_use_metric_identity_and_blocks_only" {
  command = plan
  assert {
    condition = alltrue([
      for alarm in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks :
      alarm.namespace == "AWS/WAFV2" && alarm.metric_name == "BlockedRequests" &&
      alarm.dimensions["WebACL"] == "nofos-infra-dev-waf" && alarm.dimensions["Region"] == "us-east-1" &&
      alarm.statistic == "Sum" && alarm.period == 60 && alarm.threshold == 1 &&
      alarm.treat_missing_data == "notBreaching"
    ])
    error_message = "WAF alarms must use the unique visibility metric name, regional dimensions, actual blocks, and sparse-metric handling."
  }
  assert {
    condition     = aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks["emergency"].dimensions["Rule"] == "NOFO-PDFReadability-EmergencyBlock" && aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks["upload_rate"].dimensions["Rule"] == "NOFO-PDFReadability-UploadRate"
    error_message = "Rule dimensions must match PR #12661's visibility metric names."
  }
}

run "capacity_alarms_require_sustained_service_utilization" {
  command = plan
  variables {
    pdf_readability_monitoring = {
      waf_metric_name  = "nofos-infra-dev-waf"
      cluster_name     = "nofos-infra-dev"
      region           = "us-east-1"
      cpu_threshold    = 75
      memory_threshold = 85
    }
  }
  assert {
    condition = alltrue([
      for alarm in aws_cloudwatch_metric_alarm.pdf_readability_utilization :
      alarm.namespace == "AWS/ECS" && alarm.dimensions["ClusterName"] == "nofos-infra-dev" && alarm.dimensions["ServiceName"] == "nofos-infra-dev" &&
      alarm.statistic == "Average" && alarm.period == 60 && alarm.evaluation_periods == 5 && alarm.datapoints_to_alarm == 3 && alarm.treat_missing_data == "missing"
    ])
    error_message = "Capacity indicators must use service dimensions, a three-of-five-minute window, and expose missing data."
  }
  assert {
    condition     = aws_cloudwatch_metric_alarm.pdf_readability_utilization["cpu"].threshold == 75 && aws_cloudwatch_metric_alarm.pdf_readability_utilization["memory"].threshold == 85
    error_message = "Reviewed thresholds must be configurable."
  }
}

run "dashboard_json_has_valid_metric_rows_and_scoped_dimensions" {
  command = plan
  assert {
    condition     = length(jsondecode(aws_cloudwatch_dashboard.pdf_readability[0].dashboard_body).widgets) == 5
    error_message = "Dashboard must contain explanatory text and four metric widgets."
  }
  assert {
    condition = alltrue([
      for widget in jsondecode(aws_cloudwatch_dashboard.pdf_readability[0].dashboard_body).widgets : widget.type == "metric" ? (
        widget.properties.region == "us-east-1" && widget.properties.period == 60 &&
        alltrue([for metric in widget.properties.metrics : length(metric) >= 4 && startswith(metric[0], "AWS/")])
      ) : true
    ])
    error_message = "Dashboard metric rows must remain arrays, with the expected namespace and region."
  }
  assert {
    condition = alltrue([
      for metric in jsondecode(aws_cloudwatch_dashboard.pdf_readability[0].dashboard_body).widgets[1].properties.metrics :
      metric[0] == "AWS/WAFV2" && metric[2] == "WebACL" && metric[3] == "nofos-infra-dev-waf" && metric[6] == "Region" && metric[7] == "us-east-1"
    ])
    error_message = "WAF series must use the visibility metric name, not an ACL resource name."
  }
  assert {
    condition     = strcontains(jsondecode(aws_cloudwatch_dashboard.pdf_readability[0].dashboard_body).widgets[0].properties.markdown, "disabled; destination and delivery verification pending")
    error_message = "The dashboard must disclose that notifications are not operating yet."
  }
}

run "explicit_email_destination_can_enable_actions" {
  command = plan
  variables {
    email_alert_recipients                = ["pilot-test@example.com"]
    pdf_readability_alarm_actions_enabled = true
  }
  assert {
    condition     = length(aws_sns_topic_subscription.email_integration) == 1 && aws_sns_topic_subscription.email_integration["pilot-test@example.com"].protocol == "email"
    error_message = "Explicit destination must reuse the existing SNS email subscription path."
  }
  assert {
    condition     = alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : alarm.actions_enabled && length(alarm.alarm_actions) == 1 && length(alarm.ok_actions) == 1]) && alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_utilization : alarm.actions_enabled])
    error_message = "Explicit activation must enable actions using the existing notification topic."
  }
}

run "recipient_alone_does_not_enable_pilot_actions" {
  command = plan
  variables {
    email_alert_recipients = ["pilot-test@example.com"]
  }
  assert {
    condition     = alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : !alarm.actions_enabled]) && alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_utilization : !alarm.actions_enabled])
    error_message = "Recipient configuration and pilot notification activation must be separate."
  }
}

run "existing_incident_integration_can_enable_actions" {
  command = plan
  variables {
    incident_management_service_integration_url = "https://example.com/synthetic-incident-endpoint"
    pdf_readability_alarm_actions_enabled       = true
  }
  assert {
    condition     = length(aws_sns_topic_subscription.incident_management_service_integration) == 1 && alltrue([for alarm in aws_cloudwatch_metric_alarm.pdf_readability_waf_blocks : alarm.actions_enabled])
    error_message = "Explicit incident integration must use the existing SNS mechanism."
  }
}

run "reject_notifications_without_a_destination" {
  command = plan
  variables {
    pdf_readability_alarm_actions_enabled = true
  }
  expect_failures = [var.pdf_readability_alarm_actions_enabled]
}

run "reject_notifications_without_monitoring" {
  command = plan
  variables {
    pdf_readability_monitoring            = null
    email_alert_recipients                = ["pilot-test@example.com"]
    pdf_readability_alarm_actions_enabled = true
  }
  expect_failures = [var.pdf_readability_alarm_actions_enabled]
}

run "reject_non_nofo_opt_in" {
  command = plan
  variables {
    service_name = "api-dev"
  }
  expect_failures = [var.pdf_readability_monitoring]
}

run "reject_invalid_capacity_threshold" {
  command = plan
  variables {
    pdf_readability_monitoring = {
      waf_metric_name  = "nofos-infra-dev-waf"
      cluster_name     = "nofos-infra-dev"
      region           = "us-east-1"
      memory_threshold = 101
    }
  }
  expect_failures = [var.pdf_readability_monitoring]
}
