# Simpler Grants Analytics

## Introduction

This package encapsulates a data pipeline service. The service is responsible for extracting project data from GitHub and transforming the extracted data into rows in a data warehouse. We're using Metabase to provide data visualization and Business Intelligence for the data warehouse. As an example, our [dashboard that demonstrates the flow of Simpler Grants.gov Opportunity Data from the Operational DB to the Data Warehouse](http://metabase-prod-899895252.us-east-1.elb.amazonaws.com/dashboard/100-operational-data).

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

##  Developer Information

The service is open-source and can be installed and run in a local development environment, which is useful for project maintainers and/or open source contributors. Follow the links below for more information:

1. [Technical Overview](../documentation/analytics/technical-overview.md)
2. [Getting Started Guide for Developers](../documentation/analytics/development.md)
3. [Writing and Running Tests](../documentation/analytics/testing.md)
4. [Usage Guide: Data Pipeline Service & CLI](../documentation/analytics/usage.md)

