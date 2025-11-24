locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  # The `state` is the state of the scheduled job. It can be either "ENABLED" or "DISABLED".

  scheduled_jobs = {
    sprint-reports = {
      task_command = [
        "poetry", "run", "analytics", "etl", "extract_transform_and_load"
      ]
      schedule_expression = "rate(8 hours)"
      state               = "ENABLED"
    }
    opportunity-load-csvs = {
      task_command = ["poetry", "run", "analytics", "etl", "opportunity-load"]
      # Every day at 6am Eastern Time during DST. 7am during non-DST.
      schedule_expression = "cron(0 11 * * ? *)"
      state               = "ENABLED"
    }
  }
}
