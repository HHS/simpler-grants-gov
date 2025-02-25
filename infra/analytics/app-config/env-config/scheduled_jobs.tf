locals {
<<<<<<< before updating
=======
  # The `cron` here is the literal name of the scheduled job. It can be anything you want.
  # For example "file_upload_jobs" or "daily_report". Whatever makes sense for your use case.
>>>>>>> after updating
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
<<<<<<< before updating
  # The `state` is the state of the scheduled job. It can be either "ENABLED" or "DISABLED".

  scheduled_jobs = {
    sprint-reports = {
      task_command        = ["make", "gh-extract-transform-and-load"]
      schedule_expression = "rate(1 days)"
      state               = "ENABLED"
    }
    opportunity-load-csvs = {
      task_command = ["poetry", "run", "analytics", "etl", "opportunity-load"]
      # Every day at 6am Eastern Time during DST. 7am during non-DST.
      schedule_expression = "cron(0 11 * * ? *)"
      state               = "ENABLED"
    }
=======
  scheduled_jobs = {
    # cron = {
    #   task_command        = ["python", "-m", "flask", "--app", "app.py", "cron"]
    #   schedule_expression = "cron(0 * ? * * *)"
    # }
>>>>>>> after updating
  }
}
