locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  # The `state` is the state of the scheduled job. It can be either "ENABLED" or "DISABLED".

  scheduled_jobs = {
    sprint-reports = {
      task_command        = ["make", "gh-data-export", "sprint-reports"]
      schedule_expression = "rate(1 days)"
      state               = "ENABLED"
    }
  }
}
