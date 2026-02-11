locals {
  # The `cron` here is the literal name of the scheduled job. It can be anything you want.
  # For example "file_upload_jobs" or "daily_report". Whatever makes sense for your use case.
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  scheduled_jobs = {
    # cron = {
    #   task_command        = ["python", "-m", "flask", "--app", "app.py", "cron"]
    #   schedule_expression = "cron(0 * ? * * *)"
    # }
  }
}
