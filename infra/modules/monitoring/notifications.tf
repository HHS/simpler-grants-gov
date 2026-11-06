locals {
  enqueue_monitoring   = var.notification_monitoring != null ? var.notification_monitoring.enqueue_enabled : false
  processor_monitoring = var.notification_monitoring != null ? var.notification_monitoring.processor_log_group != null : false
}

#------------------------------------------
# New opportunity notification enqueue job
#------------------------------------------

# Logged by ecs_background_task after the job_log row has been committed as COMPLETED.
# A non-matching event emits 0, so the alarm only judges hours that had log traffic.
resource "aws_cloudwatch_log_metric_filter" "notification_enqueue_completed" {
  count = local.enqueue_monitoring ? 1 : 0

  name           = "${var.service_name}-notification-enqueue-completed"
  pattern        = "{ $.message = \"Completed ECS task new-opportunity-notification\" }"
  log_group_name = var.application_log_group

  metric_transformation {
    name          = "NotificationEnqueueCompleted"
    namespace     = var.service_name
    value         = 1
    default_value = 0
    unit          = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_enqueue_not_completed" {
  count = local.enqueue_monitoring ? 1 : 0

  alarm_name          = "${var.service_name}-notification-enqueue-not-completed"
  alarm_description   = "The new-opportunity-notification job has not completed in the last ${var.notification_monitoring.enqueue_max_hours_without_completion} hours. Check the job_log table and the scheduled job's Step Functions execution."
  namespace           = var.service_name
  metric_name         = "NotificationEnqueueCompleted"
  statistic           = "Sum"
  period              = 3600
  evaluation_periods  = var.notification_monitoring.enqueue_max_hours_without_completion
  datapoints_to_alarm = var.notification_monitoring.enqueue_max_hours_without_completion
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  depends_on = [aws_cloudwatch_log_metric_filter.notification_enqueue_completed]
}

resource "aws_cloudwatch_log_metric_filter" "notification_email_body_oversize" {
  count = local.enqueue_monitoring ? 1 : 0

  name           = "${var.service_name}-notification-email-body-oversize"
  pattern        = "{ $.message = \"New opportunity email body exceeds size threshold\" }"
  log_group_name = var.application_log_group

  metric_transformation {
    name      = "NotificationEmailBodyOversize"
    namespace = var.service_name
    value     = 1
    unit      = "Count"
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_email_body_oversize" {
  count = local.enqueue_monitoring ? 1 : 0

  alarm_name          = "${var.service_name}-notification-email-body-oversize"
  alarm_description   = "The new opportunity email body was over 90 KB. Gmail clips messages over ~102 KB, so recipients may not see every opportunity."
  namespace           = var.service_name
  metric_name         = "NotificationEmailBodyOversize"
  statistic           = "Sum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  depends_on = [aws_cloudwatch_log_metric_filter.notification_email_body_oversize]
}

#------------------------------
# Notification queue processor
#------------------------------

resource "aws_cloudwatch_metric_alarm" "notification_processor_not_running" {
  count = local.processor_monitoring ? 1 : 0

  alarm_name          = "${var.service_name}-notification-processor-not-running"
  alarm_description   = "The notification queue processor has had no running tasks for 5 minutes, so queued emails are not being sent. Check the ECS service events and stopped task reasons."
  namespace           = "ECS/ContainerInsights"
  metric_name         = "RunningTaskCount"
  statistic           = "Minimum"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 5
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  # The service publishes no metric at all if it has been deleted or never started
  treat_missing_data = "breaching"
  alarm_actions      = [aws_sns_topic.this.arn]
  ok_actions         = [aws_sns_topic.this.arn]

  dimensions = {
    ClusterName = var.notification_monitoring.cluster_name
    ServiceName = var.notification_monitoring.processor_service_name
  }
}

# Logged at the start of every pass through the queue, 0 when there is nothing to send
resource "aws_cloudwatch_log_metric_filter" "notification_queue_oldest_age" {
  count = local.processor_monitoring ? 1 : 0

  name           = "${var.service_name}-notification-queue-oldest-age"
  pattern        = "{ $.oldest_age_seconds >= 0 }"
  log_group_name = var.notification_monitoring.processor_log_group

  metric_transformation {
    name      = "NotificationQueueOldestAgeSeconds"
    namespace = var.service_name
    value     = "$.oldest_age_seconds"
    unit      = "Seconds"
  }
}

resource "aws_cloudwatch_metric_alarm" "notification_queue_oldest_age" {
  count = local.processor_monitoring ? 1 : 0

  alarm_name          = "${var.service_name}-notification-queue-oldest-age"
  alarm_description   = "The oldest sendable notification_queue row has been waiting over ${var.notification_monitoring.oldest_age_threshold_seconds} seconds for ${var.notification_monitoring.oldest_age_duration_minutes} minutes. The processor may be stuck or falling behind."
  namespace           = var.service_name
  metric_name         = "NotificationQueueOldestAgeSeconds"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = var.notification_monitoring.oldest_age_duration_minutes
  datapoints_to_alarm = var.notification_monitoring.oldest_age_duration_minutes
  threshold           = var.notification_monitoring.oldest_age_threshold_seconds
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "missing"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  depends_on = [aws_cloudwatch_log_metric_filter.notification_queue_oldest_age]
}

resource "aws_cloudwatch_log_metric_filter" "notification_email_sent" {
  count = local.processor_monitoring ? 1 : 0

  name           = "${var.service_name}-notification-email-sent"
  pattern        = "{ $.message = \"Sent notification email\" }"
  log_group_name = var.notification_monitoring.processor_log_group

  metric_transformation {
    name      = "NotificationEmailSent"
    namespace = var.service_name
    value     = 1
    unit      = "Count"
  }
}

# SES caps sends at 50k per 24 hours, alert well before the processor hits it
resource "aws_cloudwatch_metric_alarm" "notification_daily_send_volume" {
  count = local.processor_monitoring ? 1 : 0

  alarm_name          = "${var.service_name}-notification-daily-send-volume"
  alarm_description   = "The notification processor has sent ${var.notification_monitoring.daily_send_threshold} or more emails in one day, approaching the SES 50k/day sending quota."
  namespace           = var.service_name
  metric_name         = "NotificationEmailSent"
  statistic           = "Sum"
  period              = 86400
  evaluation_periods  = 1
  threshold           = var.notification_monitoring.daily_send_threshold
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  depends_on = [aws_cloudwatch_log_metric_filter.notification_email_sent]
}
