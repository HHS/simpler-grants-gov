locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["poetry", "run", "flask"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  # The `state` is the state of the scheduled job. It can be either "ENABLED" or "DISABLED".

  # See api/src/data_migration/command/load_transform.py for argument specifications.
  load-transform-args = {
    # Runs, but with everything disabled.
    dev = [
      "poetry",
      "run",
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
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
      "--store-version"
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
      "--store-version"
    ],
  }
  scheduled_jobs = {
    failing-job = { # This is here to help test alerts, remove it when that's not needed.
      task_command        = ["this-command-will-fail"]
      schedule_expression = "cron(0 * * * ? *)"
      state               = "ENABLED"
    }
    load-transform = {
      task_command = local.load-transform-args[var.environment]
      # Every hour at the top of the hour
      schedule_expression = "cron(0 * * * ? *)"
      state               = "ENABLED"
    }
    populate-search-index = {
      task_command = ["poetry", "run", "flask", "load-search-data", "load-opportunity-data"]
      # Every hour at the half hour
      schedule_expression = "cron(30 * * * ? *)"
      state               = "ENABLED"
    }
    export-opportunity-data = {
      task_command = ["poetry", "run", "flask", "task", "export-opportunity-data"]
      # Every day at 4am Eastern Time during DST. 5am during non-DST.
      schedule_expression = "cron(0 9 * * ? *)"
      state               = "ENABLED"
    }
    create-analytics-db-csvs = {
      task_command = ["poetry", "run", "flask", "task", "create-analytics-db-csvs"]
      # Every day at 5am Eastern Time during DST. 6am during non-DST.
      schedule_expression = "cron(0 10 * * ? *)"
      state               = "ENABLED"
    }
  }
}
