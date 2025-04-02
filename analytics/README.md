# Simpler Grants Analytics

## Introduction

This package encapsulates a data pipeline service. The service is responsible for extracting project data from GitHub and transforming the extracted data into rows in a data warehouse. We're using Metabase to provide data visualization and Business Intelligence for the data warehouse. As an example, our [dashboard that demonstrates the flow of Simpler Grants.gov Opportunity Data from the Operational DB to the Data Warehouse](http://metabase-prod-899895252.us-east-1.elb.amazonaws.com/public/dashboard/a9011e4c-2610-4089-9da5-4ef93604ff55).

## Project Directory Structure

The structure of the analytics codebase is outlined below, relative to the root of the `simpler-grants-gov` repo.

```text
root
├── analytics
│   └── src
│       └── analytics
│           └── datasets      Create re-usable data interfaces for calculating metrics
│           └── integrations  Integrate with external systems used to export data or metrics
│   └── tests
│       └── integrations      Integration tests, mostly for src/analytics/integrations
│       └── datasets          Unit tests for src/analytics/datasets
|
│   └── config.py             Load configurations from environment vars or local .toml files
│   └── settings.toml         Default configuration settings, tracked by git
│   └── .secrets.toml         Gitignored file for secrets and configuration management
│   └── Makefile              Frequently used commands for setup, development, and CLI usage
│   └── pyproject.toml        Python project configuration file
```

## Data Pipeline

The service in this package provides capabilities to satisfy the middle step (denoted as "ETL") in the following data flow diagram:

  `SGG Project Data → GitHub → ETL → Postgres DW → Metabase → End User`

The service does not listen on a port or run as a daemon. Instead, it must be triggered manually, via `Make` commands on the command-line, or via a text-based interactive tool written in Python and referred to as CLI.

In current practice, the service is triggered daily via an AWS Step Function (akin to a cron job) orchestrated with Terraform. This results in a daily update to the analytics data warehouse in Postgres, and a visible data refresh for viewers of SGG program-level metrics dashboards in Metabase. 


## Snapshot Data Quality Tests

The service contains plugings to the pytest library to perform data comparisons.  The plugin that performs these operations is [syrupy](https://github.com/syrupy-project/syrupy).  These snapshot comparions run as part of the standard `pytest` command.  The files for comparison are inside of `root/analytics/tests/dataquality/__snapshots__`. The tests exist inside of `root/analytics/tests/dataquality`

### Updating snapshots

In the scenario where snapshots need to be updated you can follow the below instructions

After verifying that any changes To update the snapshots you can run ``pytest --snapshot-update` and the snapshots contained in the repo will be updated. Commit these updates.

##  Developer Information

The service is open-source and can be installed and run in a local development environment, which is useful for project maintainers and/or open source contributors. Follow the links below for more information:

1. [Technical Overview](../documentation/analytics/technical-overview.md)
2. [Getting Started Guide for Developers](../documentation/analytics/development.md)
3. [Writing and Running Tests](../documentation/analytics/testing.md)
4. [Usage Guide: Data Pipeline Service & CLI](../documentation/analytics/usage.md)

