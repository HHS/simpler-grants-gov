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

### Inspecting local email

Local development captures email in [Mailpit](https://mailpit.axllent.org/) instead of
sending it to real recipients. `make init` starts Mailpit with the other local
dependencies. To start it on its own, run the following from `api/`:

```bash
make init-mailpit
```

The equivalent Compose command is `docker compose up --detach mailpit`.

Open [http://localhost:8025](http://localhost:8025) to inspect message content,
recipients, sender, headers, timestamps, and raw MIME source. The local API and
notification tasks use the same inbox; for example, a locally generated organization
invitation or workflow approval message appears there immediately. Scheduled notifications
can be generated with `make run-email-notifications` after seeding suitable local data.

`local.env` routes host-run commands to `localhost:1025`, while Docker Compose overrides
the SMTP hostname to `mailpit`. The compose service does not configure SMTP relay or
forwarding, so captured messages are not delivered externally. The application also
refuses to use local SMTP unless both `ENVIRONMENT=local` and local AWS mode are active.

To temporarily restore the in-memory email mock, set
`ENABLE_LOCAL_EMAIL_CAPTURE=FALSE` in `override.env`.

## Running tests locally
1. Run `make init` or have run it previously
2. Run the tests `make test` or if you've set your PY Approach to local you probably want to run the tests in Docker so you don't have to deal with Env Vars and other config `PY_RUN_APPOACH=docker make test`

You can also run only certain tests by pattern matching the file name and log more while running the tests:
```bash
make test args="tests/src/task/notifications/*"
make test args="-x -s -vv tests/src/api/users/test_user_route_login.py"
```
* -x will stop and fail the test suite on the first test that fails
* -s will not print the commands being run
* -vv reports all runtimes, not just those above a certain threshold

## Running jobs/tasks

### Locally

```bash
make run-email-notifications
# executes uv run flask task email-notifications

# more generically, you can construct uv run flask calls with make cmd
make cmd args="data-migration setup-foreign-tables"
make cmd args="data-migration load-transform --no-load --transform --no-set-current"
make cmd args="task create-analytics-db-csvs"
```

CLI commands are of the form `<task group> <task name> <any other params>`. So in the above, data-migration is the task group for the first two, but then the task name is setup-foreign-tables and load-transform

### In AWS

1. Ensure your [SSO login](../documentation/infra/set-up-infrastructure-tools.md#recommended-aws-profile-set-up) is fresh
2. Setup your terraform environment

   ```bash
   bin/terraform-init infra/api/service <env>
   ```

3. Run the job

   ```bash
   bin/run-command api <env> '["flask", "task", "email-notifications"]'
   ```

## Technical Information

* [API Technical Overview](../documentation/api/technical-overview.md)
* [Database Management](../documentation/api/database/database-management.md)
* [Formatting and Linting](../documentation/api/formatting-and-linting.md)
* [Writing Tests](../documentation/api/writing-tests.md)
* [Logging configuration](../documentation/api/monitoring-and-observability/logging-configuration.md)
* [Logging conventions](../documentation/api/monitoring-and-observability/logging-conventions.md)
