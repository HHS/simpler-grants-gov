# Simpler Grants Analytics

## Introduction

This package encapsulates a data pipeline service. The service is responsible for extracting project data from GitHub and transforming the extracted data into rows in a data warehouse. 

## Data Pipeline

The service in this package provides capabilities to satisfy the middle step (denoted as "ETL") in the following data flow diagram:

  `SGG Project Data → GitHub → ETL → Postgres DW → Metabase → End User`

The service does not listen on a port or run as a daemon. Instead, it must be triggered manually, via `Make` commands on the command-line, or via a text-based interactive tool written in Python and referred to as CLI.

In current practice, the service is triggered daily via an AWS Step Function (akin to a cron job) orchestrated with Terraform.

##  Developer Information

The service is open-source and can be installed and run in a local development environment, which is useful for project maintainers and/or open source contributors. Follow the links below for more information:

1. [Technical Overview](../documentation/analytics/technical-overview.md)
2. [Getting Started Guide for Developers](../documentation/analytics/development.md)
3. [Writing and Running Tests](../documentation/analytics/testing.md)
4. [Usage Guide: Data Pipeline Service & CLI](../documentation/analytics/usage.md)

