mock_provider "aws" {}

variables {
  service_name             = "analytics-prod"
  load_balancer_arn_suffix = null
  application_log_group    = "service/analytics-prod"
  scheduled_job_state_machine_arns = {
    sprint-reports        = "arn:aws:states:us-east-1:123456789012:stateMachine:analytics-prod-sprint-reports"
    opportunity-load-csvs = "arn:aws:states:us-east-1:123456789012:stateMachine:analytics-prod-opportunity-load-csvs"
  }
}

run "default_adds_no_scheduled_job_alarms" {
  command = plan
  variables {
    scheduled_job_state_machine_arns = {}
  }
  assert {
    condition     = length(aws_cloudwatch_metric_alarm.scheduled_job_failed) == 0
    error_message = "No state machines must add no scheduled job alarms."
  }
}

run "one_alarm_per_scheduled_job" {
  command = plan
  assert {
    condition     = toset(keys(aws_cloudwatch_metric_alarm.scheduled_job_failed)) == toset(["sprint-reports", "opportunity-load-csvs"])
    error_message = "Every scheduled job must get its own failure alarm."
  }
  assert {
    condition     = aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].alarm_name == "analytics-prod-opportunity-load-csvs-failed"
    error_message = "Alarm name must identify the service and the job."
  }
}

run "alarm_fires_on_a_single_failed_execution" {
  command = plan
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].namespace == "AWS/States" &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].metric_name == "ExecutionsFailed" &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].dimensions["StateMachineArn"] == "arn:aws:states:us-east-1:123456789012:stateMachine:analytics-prod-opportunity-load-csvs" &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].statistic == "Sum" &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].threshold == 1 &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].comparison_operator == "GreaterThanOrEqualToThreshold" &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].evaluation_periods == 1 &&
      aws_cloudwatch_metric_alarm.scheduled_job_failed["opportunity-load-csvs"].treat_missing_data == "notBreaching"
    )
    error_message = "Alarm must fire on one failed execution of that job's state machine and stay OK when the job is idle."
  }
}

run "scheduled_job_alarms_notify_the_monitoring_topic" {
  command = plan
  assert {
    condition = alltrue([
      for alarm in values(aws_cloudwatch_metric_alarm.scheduled_job_failed) :
      length(alarm.alarm_actions) == 1 && length(alarm.ok_actions) == 1
    ])
    error_message = "Every scheduled job alarm must alert and recover through the monitoring SNS topic."
  }
}
