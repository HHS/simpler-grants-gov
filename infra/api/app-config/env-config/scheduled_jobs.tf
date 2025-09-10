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
      "--store-version",
      "--sync-status"
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
      "--store-version",
      "--sync-status"
    ],
    training = [
      "poetry",
      "run",
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version",
      "--sync-status"
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
      "--store-version",
      "--sync-status"
    ],
  }
  scheduled_jobs = {
    load-transform = {
      task_command = local.load-transform-args[var.environment]
      # Every hour at the top of the hour
      schedule_expression = "cron(0 * * * ? *)"
      state               = "ENABLED"
    }
    load-search-opportunity-data = {
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
    load-search-agency-data = {
      task_command = ["poetry", "run", "flask", "load-search-data", "load-agency-data"]
      # Every 1 hour
      schedule_expression = "cron(0 * * * ? *)"
      state               = "ENABLED"
    }
    email_notification_opportunity = {
      task_command = ["poetry", "run", "flask", "task", "email-notifications"]
      # Every day at 11:40am Eastern Time during DST. 12:40pm during non-DST.
      schedule_expression = "cron(40 16 * * ? *)"
      state               = "ENABLED"
    }
    sam-extracts = {
      task_command = ["poetry", "run", "flask", "task", "sam-extracts"]
      # Every day at 8am Eastern Time during DST. 9am during non-DST.
      schedule_expression = "cron(0 13 * * ? *)"
      state               = "ENABLED"
    }
    create-application-submission = {
      task_command = ["poetry", "run", "flask", "task", "create-application-submission"]
      # Every day at 2am Eastern Time during DST. 3am during non-DST.
      schedule_expression = "cron(0 7 * * ? *)"
      state               = "ENABLED"
    }
  }
}
