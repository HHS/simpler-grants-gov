locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html

  # See api/src/data_migration/command/load_transform.py for argument specifications.
  load-transform-args = {
    # Runs, but with everything disabled.
    dev = [
      "poetry",
      "run",
      "flask",
      "data-migration",
      "load-transform",
      "--no-load",
      "--no-transform",
      "--no-set-current",
    ],
    staging = [
      "poetry",
      "run",
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
    ],
    prod = [
      "poetry",
      "run",
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
    ],
  }
  scheduled_jobs = {
    copy-oracle-data = {
      task_command        = ["poetry", "run", "flask", "data-migration", "copy-oracle-data"]
      schedule_expression = "rate(2 minutes)"
    }
    load-transform = {
      task_command        = local.load-transform-args[var.environment]
      schedule_expression = "rate(1 days)"
    }
  }
}
