#----------------------------
# Scheduled job failures
#----------------------------

# Step Functions records a failed execution whenever the job's ECS task stops
# with a non-zero exit code, including when ECS kills it for running out of
# memory. That makes this alarm independent of the application's own logging,
# which does not survive an out-of-memory kill.
resource "aws_cloudwatch_metric_alarm" "scheduled_job_failed" {
  for_each = var.scheduled_job_state_machine_arns

  alarm_name          = "${var.service_name}-${each.key}-failed"
  alarm_description   = "Scheduled job ${each.key} (${var.service_name}) failed. Open the job's Step Functions execution history; the failure cause includes the ECS stop reason, such as OutOfMemoryError."
  namespace           = "AWS/States"
  metric_name         = "ExecutionsFailed"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.this.arn]
  ok_actions          = [aws_sns_topic.this.arn]

  dimensions = {
    StateMachineArn = each.value
  }
}
