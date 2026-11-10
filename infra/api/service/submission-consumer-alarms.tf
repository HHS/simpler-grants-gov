data "aws_sns_topic" "monitoring" {
  name = "${local.service_name}-monitoring"
}

resource "aws_cloudwatch_metric_alarm" "submission_consumer_dlq_depth" {
  count = local.enable_submission_consumer ? 1 : 0

  alarm_name          = "${local.submission_consumer_name}-dlq-not-empty"
  alarm_description   = "Submission consumer DLQ has messages: a submission failed processing and needs investigation or replay"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.dlq_alarm_threshold
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = module.sqs_queue.dead_letter_queue_name
  }

  alarm_actions = [data.aws_sns_topic.monitoring.arn]
  ok_actions    = [data.aws_sns_topic.monitoring.arn]
}

resource "aws_cloudwatch_metric_alarm" "submission_consumer_oldest_message_age" {
  count = local.enable_submission_consumer ? 1 : 0

  alarm_name          = "${local.submission_consumer_name}-oldest-message-age"
  alarm_description   = "Oldest submission message has waited too long: consumer is down, stuck, or too slow"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateAgeOfOldestMessage"
  namespace           = "AWS/SQS"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.submission_oldest_message_age_threshold_seconds
  treat_missing_data  = "notBreaching"

  dimensions = {
    QueueName = module.sqs_queue.queue_name
  }

  alarm_actions = [data.aws_sns_topic.monitoring.arn]
  ok_actions    = [data.aws_sns_topic.monitoring.arn]
}

resource "aws_cloudwatch_metric_alarm" "submission_consumer_memory" {
  count = local.enable_submission_consumer ? 1 : 0

  alarm_name          = "${local.submission_consumer_name}-memory-high"
  alarm_description   = "Submission consumer memory utilization is high: large attachments may cause out-of-memory restarts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  datapoints_to_alarm = 3
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.submission_memory_alarm_threshold_percent
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = module.service.cluster_name
    ServiceName = aws_ecs_service.submission_consumer[0].name
  }

  alarm_actions = [data.aws_sns_topic.monitoring.arn]
  ok_actions    = [data.aws_sns_topic.monitoring.arn]
}
