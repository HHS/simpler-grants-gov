trigger build

# Simpler Grants Analytics

## Introduction

This a command line interface (CLI) tool written in python that is used to run analytics on operational data for the Simpler.Grants.gov initiative. For a more in depth discussion of tools used and the structure of the codebase, view the technical details for the analytics package.

## Project directory structure

Outlines the structure of the analytics codebase, relative to the root of the simpler-grants-gov repo.

```text
root
├── analytics
│   └── src
│       └── analytics
│           └── datasets      Create re-usable data interfaces for calculating metrics
│           └── integrations  Integrate with external systems used to export data or metrics
│           └── metrics       Calculate the project's operational metrics
│   └── tests
│       └── integrations      Integration tests, mostly for src/analytics/integrations
│       └── datasets          Unit tests for src/analytics/datasets
│       └── metrics           Unit tests for src/analytics/metrics
|
│   └── config.py             Load configurations from environment vars or local .toml files
│   └── settings.toml         Default configuration settings, tracked by git
│   └── .secrets.toml         Gitignored file for secrets and configuration management
│   └── Makefile              Frequently used commands for setup, development, and CLI usage
│   └── pyproject.toml        Python project configuration file
```

## Using the tool

Project maintainers and members of the public have a few options for interacting with the tool and the reports it produces. Read more about each option in the [usage guide](../documentation/analytics/usage.md):

1. [Viewing the reports in Slack](../documentation/analytics/usage.md#view-daily-reports-in-slack)
2. [Triggering reports from GitHub](../documentation/analytics/usage.md#trigger-a-report-from-github)
3. [Triggering reports from the command line](../documentation/analytics/usage.md#trigger-a-report-from-the-command-line)

## Contributing to the tool

Project maintainers or open source contributors are encouraged to contribute to the tool. Follow the guides linked below for more information:

1. [Technical overview](../documentation/analytics/technical-overview.md)
2. [Installation and development guide](../documentation/analytics/development.md)
   - [Adding a new data source](../documentation/analytics/development.md#adding-a-new-dataset)
   - [Adding a new metric](../documentation/analytics/development.md#adding-a-new-metric)
3. [Writing and running tests](../documentation/analytics/testing.md)
4. [Command line interface (CLI) user guide](../documentation/analytics/usage.md#using-the-command-line-interface)
5. [Description of existing metrics](../documentation/analytics/metrics/README.md)
