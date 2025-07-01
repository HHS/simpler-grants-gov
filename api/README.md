# Application Documentation

## Introduction

This is the API layer. It includes a few separate components:

* The REST API
* Backend & utility scripts

## Project Directory Structure

```text
root
├── api
│   └── src
│       └── auth                Authentication code for API
│       └── db
│           └── models          DB model definitions
│           └── migrations      DB migration configs
│               └── versions    The DB migrations
│       └── logging
│       └── route               API route definitions
│           └── handler         API route implementations
│       └── scripts             Backend scripts that run separate from the application
|       └── services            Methods for service layer
│       └── util                Utility methods and classes useful to most areas of the code
│
│   └── tests
│   └── local.env           Environment variable configuration for local files
│   └── Makefile            Frequently used CLI commands for docker and utilities
│   └── pyproject.toml      Python project configuration file
│   └── setup.cfg           Python config for tools that don't support pyproject.toml yet
│   └── Dockerfile          Docker build file for project
│
└── docker-compose.yml  Config file for docker compose tool, used for local development
```

## Local Development

See [development.md](../documentation/api/development.md) for installation and development instructions.

## Running tests locally
1. Start the services with `docker compose up`
2. In another terminal run the tests `make test` or if you've set your PY Approach to local you probably want to run the tests in Docker so you don't have to deal with Env Vars and other config `PY_RUN_APPOACH=docker make test`

You can also run only certain tests by pattern matching the file name:
```bash
make test args="tests/src/task/notifications/*"
```

## Running jobs/tasks

### Locally

```bash
make run-generate-notifications
# executes poetry run flask task generate-notifications

# more generically, you can construct poetry run flask calls with make cmd
make cmd args="data-migration setup-foreign-tables"
make cmd args="data-migration load-transform --no-load --transform --no-set-current"
make cmd args="task create-analytics-db-csvs"
```

Poetry CLI commands are of the form `<task group> <task name> <any other params>`. So in the above, data-migration is the task group for the first two, but then the task name is setup-foreign-tables and load-transform

### In AWS

1. Ensure your [SSO login](documentation/infra/set-up-infrastructure-tools.md#recommended-aws-profile-set-up) is fresh
2. Setup your terraform environment

   ```bash
   bin/terraform-init infra/api/service <env>
   ```

3. Run the job

   ```bash
   bin/run-command api <env> '["poetry", "run", "flask", "task", "generate-notifications"]'
   ```

## Technical Information

* [API Technical Overview](../documentation/api/technical-overview.md)
* [Database Management](../documentation/api/database/database-management.md)
* [Formatting and Linting](../documentation/api/formatting-and-linting.md)
* [Writing Tests](../documentation/api/writing-tests.md)
* [Logging configuration](../documentation/api/monitoring-and-observability/logging-configuration.md)
* [Logging conventions](../documentation/api/monitoring-and-observability/logging-conventions.md)
