# Usage Guide: Data Pipeline Service & CLI 

## Purpose

This package encapsulates a data-pipeline service and a CLI that can be used to discover and execute data-pipeline commands. This usage guide describes overall usage instructions and some common use cases. 

## Pre-Requisites 

This guide assumes the analytics package is installed in the reader's local development environment. For more information about how to install and run the analytics package, visit the [Getting Started Guide for Developers](development.md).

## Data Pipeline Commands

### Using `make`

Currently available data-pipeline commands are defined in the project [`Makefile`](../../analytics/Makefile). Commands can be invoked from the command line, as in the following examples:

- `make install` - Verify that dependencies are installed 
- `make db-migrate` - Initialize or update analytics database schema 
- `make gh-data-export` - Export issue and sprint data from GitHub to a local flatfile 
- `make gh-transform-and-load` - Transform GitHub project data and load it into the analytics database

### Using the CLI

The CLI can be used to discover and interactively execute data-pipeline commands.  To run the CLI, type the following into the command line to view a list of available commands:

```bash
poetry run analytics --help 
```

![Screenshot of passing the --help flag to CLI entry point](../../analytics/static/screenshot-cli-help.png)

Discover the arguments required for a particular command by appending the `--help` flag to that command:

```bash
poetry run analytics export gh_issue_data --help
```

![Screenshot of passing the --help flag to a specific command](../../analytics/static/screenshot-command-help.png)

## Common Use Cases

### Export GitHub Data

Export SGG project data (sprints, issues, epics, deliverables, etc.) from GitHub for local analysis:

```bash
make gh-data-export
```

The output from this command can be found in the `analytics/data/` directory.

### Transform Github Data and Load into Analytics DB

After exporting SGG project data from GitHub, use `make` to transform and load the exported data into the local analytics database instance:
```bash
make gh-transform-and-load
```

The same can be achieved with the more verbose and more flexible `poetry` command:
```bash
poetry run analytics etl transform_and_load --issue-file ./data/test-etl-01.json --effective-date 2024-10-28 
```



