locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  scheduled_jobs = {
    copy-oracle-data = {
      task_command        = ["poetry", "run", "flask", "data-migration", "copy-oracle-data"]
      schedule_expression = "rate (2 minutes)"
    }
  }
}
g
