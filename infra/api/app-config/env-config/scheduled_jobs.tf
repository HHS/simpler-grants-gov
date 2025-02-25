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
=======
  scheduled_jobs = {
    # cron = {
    #   task_command        = ["python", "-m", "flask", "--app", "app.py", "cron"]
    #   schedule_expression = "cron(0 * ? * * *)"
    # }
>>>>>>> after updating
  }
}
