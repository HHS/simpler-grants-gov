mock_provider "aws" {}

variables {
  service_name             = "api-staging"
  load_balancer_arn_suffix = "app/api-staging/abc123"
  application_log_group    = "service/api-staging"
  notification_monitoring = {
    enqueue_enabled        = true
    cluster_name           = "api-staging"
    processor_service_name = "api-staging-processor"
    processor_log_group    = "service/api-staging-processor"
  }
}

run "default_adds_no_notification_monitoring" {
  command = plan
  variables {
    notification_monitoring = null
  }
  assert {
    condition = (
      length(aws_cloudwatch_log_metric_filter.notification_enqueue_completed) == 0 &&
      length(aws_cloudwatch_metric_alarm.notification_enqueue_not_completed) == 0 &&
      length(aws_cloudwatch_metric_alarm.notification_email_body_oversize) == 0 &&
      length(aws_cloudwatch_metric_alarm.notification_processor_not_running) == 0 &&
      length(aws_cloudwatch_metric_alarm.notification_queue_oldest_age) == 0 &&
      length(aws_cloudwatch_metric_alarm.notification_daily_send_volume) == 0
    )
    error_message = "Null must add no notification filters or alarms."
  }
}

run "enqueue_only_when_processor_not_deployed" {
  command = plan
  variables {
    notification_monitoring = {
      enqueue_enabled        = true
      cluster_name           = "api-prod"
      processor_service_name = "api-prod-processor"
    }
  }
  assert {
    condition     = length(aws_cloudwatch_metric_alarm.notification_enqueue_not_completed) == 1 && length(aws_cloudwatch_metric_alarm.notification_email_body_oversize) == 1
    error_message = "Enqueue alarms must be created when the job is enabled."
  }
  assert {
    condition = (
      length(aws_cloudwatch_metric_alarm.notification_processor_not_running) == 0 &&
      length(aws_cloudwatch_log_metric_filter.notification_queue_oldest_age) == 0 &&
      length(aws_cloudwatch_log_metric_filter.notification_email_sent) == 0
    )
    error_message = "Processor alarms must not be created without a processor log group."
  }
}

run "processor_only_when_enqueue_disabled" {
  command = plan
  variables {
    notification_monitoring = {
      enqueue_enabled        = false
      cluster_name           = "api-staging"
      processor_service_name = "api-staging-processor"
      processor_log_group    = "service/api-staging-processor"
    }
  }
  assert {
    condition     = length(aws_cloudwatch_log_metric_filter.notification_enqueue_completed) == 0 && length(aws_cloudwatch_metric_alarm.notification_email_body_oversize) == 0
    error_message = "Enqueue alarms must not be created when the job is disabled."
  }
  assert {
    condition     = length(aws_cloudwatch_metric_alarm.notification_processor_not_running) == 1 && length(aws_cloudwatch_metric_alarm.notification_daily_send_volume) == 1
    error_message = "Processor alarms must be created when the processor is deployed."
  }
}

run "enqueue_alarm_fires_after_window_without_completion" {
  command = plan
  assert {
    condition     = aws_cloudwatch_log_metric_filter.notification_enqueue_completed[0].log_group_name == "service/api-staging"
    error_message = "Enqueue completion filter must read the application log group the scheduled job logs to."
  }
  assert {
    condition = (
      aws_cloudwatch_log_metric_filter.notification_enqueue_completed[0].metric_transformation[0].default_value == "0" &&
      aws_cloudwatch_metric_alarm.notification_enqueue_not_completed[0].period == 3600 &&
      aws_cloudwatch_metric_alarm.notification_enqueue_not_completed[0].evaluation_periods == 26 &&
      aws_cloudwatch_metric_alarm.notification_enqueue_not_completed[0].datapoints_to_alarm == 26 &&
      aws_cloudwatch_metric_alarm.notification_enqueue_not_completed[0].comparison_operator == "LessThanThreshold" &&
      aws_cloudwatch_metric_alarm.notification_enqueue_not_completed[0].threshold == 1
    )
    error_message = "Enqueue alarm must fire only after 26 straight hours with no completion."
  }
}

run "processor_not_running_uses_container_insights" {
  command = plan
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.notification_processor_not_running[0].namespace == "ECS/ContainerInsights" &&
      aws_cloudwatch_metric_alarm.notification_processor_not_running[0].metric_name == "RunningTaskCount" &&
      aws_cloudwatch_metric_alarm.notification_processor_not_running[0].dimensions["ServiceName"] == "api-staging-processor" &&
      aws_cloudwatch_metric_alarm.notification_processor_not_running[0].dimensions["ClusterName"] == "api-staging" &&
      aws_cloudwatch_metric_alarm.notification_processor_not_running[0].treat_missing_data == "breaching"
    )
    error_message = "Processor alarm must watch the processor service's running task count and treat missing data as down."
  }
}

run "oldest_age_requires_sustained_breach" {
  command = plan
  variables {
    notification_monitoring = {
      enqueue_enabled              = true
      cluster_name                 = "api-staging"
      processor_service_name       = "api-staging-processor"
      processor_log_group          = "service/api-staging-processor"
      oldest_age_threshold_seconds = 600
      oldest_age_duration_minutes  = 10
    }
  }
  assert {
    condition = (
      aws_cloudwatch_log_metric_filter.notification_queue_oldest_age[0].log_group_name == "service/api-staging-processor" &&
      aws_cloudwatch_log_metric_filter.notification_queue_oldest_age[0].metric_transformation[0].value == "$.oldest_age_seconds"
    )
    error_message = "Oldest age filter must publish oldest_age_seconds from the processor logs."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].statistic == "Maximum" &&
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].comparison_operator == "GreaterThanThreshold" &&
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].threshold == 600 &&
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].period == 60 &&
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].evaluation_periods == 10 &&
      aws_cloudwatch_metric_alarm.notification_queue_oldest_age[0].datapoints_to_alarm == 10
    )
    error_message = "Oldest age alarm must need every minute of the window above the threshold, so 0 and short spikes don't fire."
  }
}

run "daily_send_volume_alarms_before_ses_quota" {
  command = plan
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.notification_daily_send_volume[0].period == 86400 &&
      aws_cloudwatch_metric_alarm.notification_daily_send_volume[0].statistic == "Sum" &&
      aws_cloudwatch_metric_alarm.notification_daily_send_volume[0].threshold == 30000 &&
      aws_cloudwatch_metric_alarm.notification_daily_send_volume[0].comparison_operator == "GreaterThanOrEqualToThreshold"
    )
    error_message = "Send volume alarm must fire at 30k sends per day."
  }
}

run "all_notification_alarms_notify_the_monitoring_topic" {
  command = plan
  assert {
    condition = alltrue([
      for alarm in concat(
        aws_cloudwatch_metric_alarm.notification_enqueue_not_completed,
        aws_cloudwatch_metric_alarm.notification_email_body_oversize,
        aws_cloudwatch_metric_alarm.notification_processor_not_running,
        aws_cloudwatch_metric_alarm.notification_queue_oldest_age,
        aws_cloudwatch_metric_alarm.notification_daily_send_volume,
      ) : length(alarm.alarm_actions) == 1 && length(alarm.ok_actions) == 1
    ])
    error_message = "Every notification alarm must alert and recover through the monitoring SNS topic."
  }
}

run "rejects_out_of_range_window" {
  command = plan
  variables {
    notification_monitoring = {
      enqueue_enabled                      = true
      cluster_name                         = "api-staging"
      processor_service_name               = "api-staging-processor"
      enqueue_max_hours_without_completion = 200
    }
  }
  expect_failures = [var.notification_monitoring]
}
