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
└── docker-compose.yml  Config file for docker-compose tool, used for local development
```

## Local Development

See [development.md](../documentation/api/development.md) for installation and development instructions.

## Technical Information

* [API Technical Overview](../documentation/api/technical-overview.md)
* [Database Management](../documentation/api/database/database-management.md)
* [Formatting and Linting](../documentation/api/formatting-and-linting.md)
* [Writing Tests](../documentation/api/writing-tests.md)
* [Logging configuration](../documentation/api/monitoring-and-observability/logging-configuration.md)
* [Loggin conventions](../documentation/api/monitoring-and-observability/logging-conventions.md)
