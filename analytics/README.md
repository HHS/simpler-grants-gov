# Simpler Grants Analytics

## Introduction

This package encapsulates a data pipeline service. The service is responsible for extracting project data from GitHub and transforming the extracted data into rows in a data warehouse. 

## Data Pipeline

The service in this package provides capabilities to satisfy the middle step (denoted as "ETL") in the following data flow diagram:

  `SGG Project Data → GitHub → ETL → Postgres DW → Metabase → End User`

The service does not listen on a port or run as a daemon. Instead, it must be triggered manually, via `Make` commands on the command-line, or via a text-based interactive tool written in Python and referred to as CLI.

In current practice, the service is triggered daily via an AWS Step Function (akin to a cron job) orchestrated with Terraform.

## Local Development

The service may be installed and run locally, which is useful for project maintainers and/or open source contributors. Follow the links below for more information:

1. [Technical overview](../documentation/analytics/technical-overview.md)
2. [Installation and development guide](../documentation/analytics/development.md)
   - [Adding a new data source](../documentation/analytics/development.md#adding-a-new-dataset)
3. [Writing and running tests](../documentation/analytics/testing.md)
4. [Command line interface (CLI) user guide](../documentation/analytics/usage.md#using-the-command-line-interface)

