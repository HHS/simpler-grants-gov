locals {
  pdf_readability_waf_rules = var.pdf_readability_monitoring == null ? {} : {
    emergency   = "NOFO-PDFReadability-EmergencyBlock"
    upload_rate = "NOFO-PDFReadability-UploadRate"
  }
  pdf_readability_utilization = var.pdf_readability_monitoring == null ? {} : {
    cpu = {
      metric    = "CPUUtilization"
      threshold = var.pdf_readability_monitoring.cpu_threshold
    }
    memory = {
      metric    = "MemoryUtilization"
      threshold = var.pdf_readability_monitoring.memory_threshold
    }
  }
}

# Count observations appear on the dashboard, but only actual WAF blocks alarm.
resource "aws_cloudwatch_metric_alarm" "pdf_readability_waf_blocks" {
  for_each = local.pdf_readability_waf_rules

  alarm_name          = "${var.service_name}-pdf-readability-${each.key}-blocks"
  alarm_description   = "NOFO PDF pilot ${each.key} rule blocked requests. Inspect the pilot dashboard and agreed incident procedure."
  namespace           = "AWS/WAFV2"
  metric_name         = "BlockedRequests"
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  actions_enabled     = var.pdf_readability_alarm_actions_enabled
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    WebACL = var.pdf_readability_monitoring.waf_metric_name
    Rule   = each.value
    Region = var.pdf_readability_monitoring.region
  }
}

# These service-wide signals are useful capacity indicators, not worker counters.
resource "aws_cloudwatch_metric_alarm" "pdf_readability_utilization" {
  for_each = local.pdf_readability_utilization

  alarm_name          = "${var.service_name}-pdf-readability-high-${each.key}"
  alarm_description   = "NOFO service ${each.key} utilization reached a provisional threshold in three of five minutes; this does not measure occupied web workers."
  namespace           = "AWS/ECS"
  metric_name         = each.value.metric
  statistic           = "Average"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 3
  threshold           = each.value.threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "missing"
  actions_enabled     = var.pdf_readability_alarm_actions_enabled
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    ClusterName = var.pdf_readability_monitoring.cluster_name
    ServiceName = var.service_name
  }
}

resource "aws_cloudwatch_dashboard" "pdf_readability" {
  count = var.pdf_readability_monitoring == null ? 0 : 1

  dashboard_name = "${var.service_name}-pdf-readability"
  dashboard_body = var.pdf_readability_monitoring == null ? jsonencode({ widgets = [] }) : jsonencode({
    widgets = [
      {
        type = "text"
        x    = 0, y = 0, width = 24, height = 4
        properties = {
          markdown = "# NOFO PDF pilot operations\nPilot alarm notifications: **${var.pdf_readability_alarm_actions_enabled ? "enabled; verify subscription confirmation and delivery" : "disabled; destination and delivery verification pending"}**.\nWAF rule series need the controls from PR #12661. Rate Count shows over-threshold matches, not all uploads. Service-wide latency/CPU/memory are not pilot-only or worker occupancy. Missing data is not proof of safety. Follow the release gate and incident procedure."
        }
      },
      {
        type = "metric"
        x    = 0, y = 4, width = 12, height = 6
        properties = {
          title  = "Pilot WAF controls and all-route WAF blocks"
          region = var.pdf_readability_monitoring.region
          view   = "timeSeries"
          period = 60
          stat   = "Sum"
          metrics = concat([
            for key, rule in local.pdf_readability_waf_rules :
            ["AWS/WAFV2", "CountedRequests", "WebACL", var.pdf_readability_monitoring.waf_metric_name, "Rule", rule, "Region", var.pdf_readability_monitoring.region, { label = "${key}: Count matches" }]
            ], [
            for key, rule in local.pdf_readability_waf_rules :
            ["AWS/WAFV2", "BlockedRequests", "WebACL", var.pdf_readability_monitoring.waf_metric_name, "Rule", rule, "Region", var.pdf_readability_monitoring.region, { label = "${key}: blocked" }]
            ], [
            ["AWS/WAFV2", "BlockedRequests", "WebACL", var.pdf_readability_monitoring.waf_metric_name, "Rule", "ALL", "Region", var.pdf_readability_monitoring.region, { label = "All-route WAF blocks" }]
          ])
        }
      },
      {
        type = "metric"
        x    = 12, y = 4, width = 12, height = 6
        properties = {
          title  = "NOFO service-wide ALB errors and forwarded requests"
          region = var.pdf_readability_monitoring.region
          view   = "timeSeries"
          period = 60
          stat   = "Sum"
          metrics = [
            for metric in ["HTTPCode_ELB_5XX_Count", "HTTPCode_Target_5XX_Count", "HTTPCode_ELB_4XX_Count", "RequestCount"] :
            ["AWS/ApplicationELB", metric, "LoadBalancer", var.load_balancer_arn_suffix]
          ]
        }
      },
      {
        type = "metric"
        x    = 0, y = 10, width = 12, height = 6
        properties = {
          title  = "NOFO service-wide target response time (seconds)"
          region = var.pdf_readability_monitoring.region
          view   = "timeSeries"
          period = 60
          stat   = "p95"
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_arn_suffix, { stat = "p95", label = "p95 target response time" }],
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.load_balancer_arn_suffix, { stat = "Average", label = "Average target response time" }]
          ]
        }
      },
      {
        type = "metric"
        x    = 12, y = 10, width = 12, height = 6
        properties = {
          title  = "NOFO service-wide utilization (not worker occupancy)"
          region = var.pdf_readability_monitoring.region
          view   = "timeSeries"
          period = 60
          stat   = "Average"
          metrics = [
            for key, config in local.pdf_readability_utilization :
            ["AWS/ECS", config.metric, "ClusterName", var.pdf_readability_monitoring.cluster_name, "ServiceName", var.service_name]
          ]
        }
      }
    ]
  })
}
