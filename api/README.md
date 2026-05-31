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
make run-generate-notifications
# executes uv run flask task generate-notifications

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
   bin/run-command api <env> '["flask", "task", "generate-notifications"]'
   ```

## Endpoints

### Health Check

`GET /health`

Verifies that the application and its database connection are functioning. Useful for confirming your local stack is running:

```bash
curl http://localhost:8080/health
```

#### Success response — `200 OK`

```json
{
  "message": "Service healthy",
  "data": {
    "commit_sha": "ffaca647223e0b6e54344122eefa73401f5ec131",
    "commit_link": "https://github.com/HHS/simpler-grants-gov/commit/ffaca647223e0b6e54344122eefa73401f5ec131",
    "release_notes_link": "https://github.com/HHS/simpler-grants-gov/releases",
    "last_deploy_time": "2025-06-01T10:00:00",
    "deploy_whoami": "runner"
  },
  "status_code": 200
}
```

#### Failure response — `503 Service Unavailable`

Returned when the database connectivity check (`SELECT 1`) fails. The response body contains a generic error message.

#### Response fields

| Field | Description |
|---|---|
| `commit_sha` | GitHub commit SHA for the latest deployed commit |
| `commit_link` | GitHub link to the latest deployed commit |
| `release_notes_link` | Link to the release notes |
| `last_deploy_time` | Latest deploy time (US/Eastern) |
| `deploy_whoami` | The user or identity that performed the deploy |

## Technical Information

* [API Technical Overview](../documentation/api/technical-overview.md)
* [Database Management](../documentation/api/database/database-management.md)
* [Formatting and Linting](../documentation/api/formatting-and-linting.md)
* [Writing Tests](../documentation/api/writing-tests.md)
* [Logging configuration](../documentation/api/monitoring-and-observability/logging-configuration.md)
* [Logging conventions](../documentation/api/monitoring-and-observability/logging-conventions.md)
