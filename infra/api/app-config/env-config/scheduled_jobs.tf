locals {
  # The `task_command` is what you want your scheduled job to run, for example: ["flask", "example-job"].
  # Schedule expression defines the frequency at which the job should run.
  # The syntax for `schedule_expression` is explained in the following documentation:
  # https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-scheduled-rule-pattern.html
  # The `state` is the state of the scheduled job. It can be either "ENABLED" or "DISABLED".

  # See api/src/data_migration/command/load_transform.py for argument specifications.
  load-transform-args = {
    # Runs, but with everything disabled.
    dev = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    "infra-dev" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    staging = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    # Mirrors staging.
    "infra-staging" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    training = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    # Mirrors training.
    "infra-training" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    grantee1 = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    # Mirrors grantee1.
    "infra-grantee1" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    grantee2 = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    # Mirrors grantee2.
    "infra-grantee2" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    grantor1 = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    # Mirrors grantor1.
    "infra-grantor1" = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
    prod = [
      "flask",
      "data-migration",
      "load-transform",
      "--load",
      "--transform",
      "--set-current",
      "--store-version"
    ],
  }

  # Below is the config for overriding the defaults for the step functions.
  scheduled_jobs_config = {
    training = {
      cpu = 1024
      mem = 4096
      # To configure environment variables uncomment the below section
      /*
      environment_vars = [
        {
          "Name" : "test",
          "Value" : "test-value"
        }
      ]
      */
    }

    "infra-training" = {
      cpu = 1024
      mem = 4096
    }
    prod = {
      cpu = 1024
      mem = 4096
    }
  }
  sam-extract-args = {
    # In dev/staging we don't fetch extracts, but generate our own
    dev              = ["flask", "task", "sam-extracts", "--no-fetch-extracts", "--setup-lower-env"]
    "infra-dev"      = ["flask", "task", "sam-extracts", "--no-fetch-extracts", "--setup-lower-env"]
    staging          = ["flask", "task", "sam-extracts", "--no-fetch-extracts", "--setup-lower-env"]
    "infra-staging"  = ["flask", "task", "sam-extracts", "--no-fetch-extracts", "--setup-lower-env"]
    training         = ["flask", "task", "sam-extracts"]
    "infra-training" = ["flask", "task", "sam-extracts"]
    grantee1         = ["flask", "task", "sam-extracts"]
    "infra-grantee1" = ["flask", "task", "sam-extracts"]
    grantee2         = ["flask", "task", "sam-extracts"]
    "infra-grantee2" = ["flask", "task", "sam-extracts"]
    grantor1         = ["flask", "task", "sam-extracts"]
    "infra-grantor1" = ["flask", "task", "sam-extracts"]
    prod             = ["flask", "task", "sam-extracts"]
  }
  setup-lower-env-agencies-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "DISABLED"
    "infra-training" = "DISABLED"
    grantee1         = "DISABLED"
    "infra-grantee1" = "DISABLED"
    grantee2         = "DISABLED"
    "infra-grantee2" = "DISABLED"
    grantor1         = "DISABLED"
    "infra-grantor1" = "DISABLED"
    prod             = "DISABLED"
  }
  build-automatic-opportunities-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "ENABLED"
    "infra-training" = "ENABLED"
    grantee1         = "DISABLED"
    "infra-grantee1" = "DISABLED"
    grantee2         = "DISABLED"
    "infra-grantee2" = "DISABLED"
    grantor1         = "DISABLED"
    "infra-grantor1" = "DISABLED"
    prod             = "DISABLED"
  }
  load-transform-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "ENABLED"
    "infra-training" = "ENABLED"
    grantee1         = "ENABLED"
    "infra-grantee1" = "ENABLED"
    grantee2         = "ENABLED"
    "infra-grantee2" = "ENABLED"
    grantor1         = "ENABLED"
    "infra-grantor1" = "ENABLED"
    prod             = "ENABLED"
  }
  sam-extracts-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "ENABLED"
    "infra-training" = "ENABLED"
    grantee1         = "ENABLED"
    "infra-grantee1" = "ENABLED"
    grantee2         = "ENABLED"
    "infra-grantee2" = "ENABLED"
    grantor1         = "ENABLED"
    "infra-grantor1" = "ENABLED"
    prod             = "ENABLED"
  }
  create-analytics-db-csvs-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "ENABLED"
    "infra-training" = "ENABLED"
    grantee1         = "ENABLED"
    "infra-grantee1" = "ENABLED"
    grantee2         = "ENABLED"
    "infra-grantee2" = "ENABLED"
    grantor1         = "ENABLED"
    "infra-grantor1" = "ENABLED"
    prod             = "ENABLED"
  }
  email-notification-opportunity-state = {
    dev              = "ENABLED"
    "infra-dev"      = "ENABLED"
    staging          = "ENABLED"
    "infra-staging"  = "ENABLED"
    training         = "ENABLED"
    "infra-training" = "ENABLED"
    grantee1         = "DISABLED"
    "infra-grantee1" = "DISABLED"
    grantee2         = "DISABLED"
    "infra-grantee2" = "DISABLED"
    grantor1         = "DISABLED"
    "infra-grantor1" = "DISABLED"
    prod             = "ENABLED"
  }
  scheduled_jobs = {
    load-transform = {
      task_command = local.load-transform-args[var.environment]
      # Every hour at the top of the hour
      schedule_expression = "cron(0 * * * ? *)"
      state               = local.load-transform-state[var.environment]
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    load-user-tables = {
      # The user tables only need daily freshness, so they load here instead of in the
      # hourly load-transform cycle.
      #
      # Load only. Transform, set-current, and store-version are all opportunity steps that
      # have no bearing on the user tables, and store-version in particular must stay off:
      # it writes opportunity_version off the opportunity_change_audit queue, and this job
      # can overlap the hourly cycle (which runs every hour, with the job lock disabled here),
      # so it would risk versioning opportunities midway through the hourly transform.
      task_command = [
        "flask",
        "data-migration",
        "load-transform",
        "--load",
        "--no-transform",
        "--no-set-current",
        "--no-store-version",
        "-t",
        "vuser_account",
        "-t",
        "tuser_profile"
      ]
      # Every day at 3:45am Eastern Time during DST. 2:45am during non-DST.
      # Minute 45 is the only minute free of the hourly jobs (0, 15, and 30 are all taken),
      # and hour 7 is free of the daily jobs. Nothing consumes these staging tables yet, so
      # the slot is chosen purely to stay clear of the rest of the schedule.
      schedule_expression = "cron(45 7 * * ? *)"
      state               = local.load-transform-state[var.environment]
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      # This job shares the load-transform job type with the hourly job, so the lock is
      # disabled to keep the two from blocking each other.
      environment_vars = concat(
        try(local.scheduled_jobs_config[var.environment].environment_vars, []),
        [
          {
            Name  = "ENABLE_JOB_LOCK"
            Value = "false"
          }
        ]
      )
    }
    load-search-opportunity-data = {
      task_command = ["flask", "load-search-data", "load-opportunity-data"]
      # Every hour at the half hour
      schedule_expression = "cron(30 * * * ? *)"
      state               = "ENABLED"
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
      role_override       = "opensearch-write"
    }
    export-opportunity-data = {
      task_command = ["flask", "task", "export-opportunity-data"]
      # Every day at 4am Eastern Time during DST. 5am during non-DST.
      schedule_expression = "cron(0 9 * * ? *)"
      state               = "ENABLED"
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    create-analytics-db-csvs = {
      task_command = ["flask", "task", "create-analytics-db-csvs"]
      # Every day at 5am Eastern Time during DST. 6am during non-DST.
      schedule_expression = "cron(0 10 * * ? *)"
      state               = local.create-analytics-db-csvs-state[var.environment]
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    load-search-agency-data = {
      task_command = ["flask", "load-search-data", "load-agency-data"]
      # Every 1 hour
      schedule_expression = "cron(0 * * * ? *)"
      state               = "ENABLED"
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
      role_override       = "opensearch-write"
    }
    email_notification_opportunity = {
      task_command = ["flask", "task", "email-notifications"]
      # Every day at 11:40am Eastern Time during DST. 12:40pm during non-DST.
      schedule_expression = "cron(40 16 * * ? *)"
      state               = local.email-notification-opportunity-state[var.environment]
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    sam-extracts = {
      task_command = local.sam-extract-args[var.environment]
      # Every day at 8am Eastern Time during DST. 9am during non-DST.
      schedule_expression = "cron(0 13 * * ? *)"
      state               = local.sam-extracts-state[var.environment]
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    create-application-submission = {
      task_command = ["flask", "task", "create-application-submission"]
      # Every hour at minute 15 (offset to avoid collision with other hourly jobs)
      schedule_expression = "cron(15 * * * ? *)"
      state               = "ENABLED"
      cpu                 = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem                 = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars    = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    build-automatic-opportunities = {
      task_command = ["flask", "task", "build-automatic-opportunities"]
      # Every day at 7:15am Eastern Time during DST. 8:15am during non-DST.
      # Runs just before the search load job that runs 30 minutes after the hour.
      schedule_expression = "cron(15 12 * * ? *)"
      # Only enable in dev/staging/training, do not run in prod
      state            = local.build-automatic-opportunities-state[var.environment]
      cpu              = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem              = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
    setup-lower-env-agencies = {
      task_command = ["flask", "task", "setup-lower-env-agencies"]
      # Every day at 7:45am Eastern Time during DST. 8:45am during non-DST.
      # Runs just before the agency search load job that runs at the top of the hour.
      schedule_expression = "cron(45 12 * * ? *)"
      # Only enable in dev/staging, do not run in training/prod
      state            = local.setup-lower-env-agencies-state[var.environment]
      cpu              = try(local.scheduled_jobs_config[var.environment].cpu, null)
      mem              = try(local.scheduled_jobs_config[var.environment].mem, null)
      environment_vars = try(local.scheduled_jobs_config[var.environment].environment_vars, null)
    }
  }
}
