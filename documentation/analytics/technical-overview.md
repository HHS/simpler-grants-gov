# Technical Overview

## Key technologies

The analytics package is written in Python. It marshalls data using pandas, exposes a command line interface using typer, and connects to Postgres via SQLAlchemy:

- [pandas][pandas-docs] ([source code][pandas-source]) - Used to manipulate and analyze data
- [typer][typer-docs] ([source code][typer-source]) - Used to build the CLI for the analytics package
- [sqlalchemy][sqlalchemy-docs] ([source code][sqlalchemy-source]) - Used to connect python code to Postgres database
- [dynaconf][dynaconf-docs] ([source code][dynaconf-source]) - Used to manage configuration variables and secrets

## Integrations

In order to obtain input data for our pipeline, the analytics package is integrated with GitHub. Integrations of third-party tools, such as GitHub, are encapsulated and maintained as individual modules in [analytics/integrations](../../analytics/src/analytics/integrations/).

### GitHub

We use the GitHub GraphQL API to export data from GitHub. 

- [GitHub integration](../../analytics/src/analytics/integrations/github/)

## Orchestration

In current practice, the service is triggered daily via an AWS Step Function orchestrated with Terraform. The service may also be triggered on-demand in the AWS console (access privs required). 

- [Terraform config file](../infra/analytics/app-config/env-config/scheduled_jobs.tf)
- [AWS Step Function console](https://us-east-1.console.aws.amazon.com/states/home?region=us-east-1#/statemachines)

<!-- Key technologies -->
[sqlalchemy-docs]: https://www.sqlalchemy.org
[sqlalchemy-source]: https://github.com/sqlalchemy/sqlalchemy
[pandas-docs]: https://pandas.pydata.org/docs/index.html
[pandas-source]: https://github.com/pandas-dev/pandas
[typer-docs]: https://typer.tiangolo.com/
[typer-source]: https://github.com/tiangolo/typer
[dynaconf-docs]: https://www.dynaconf.com/
[dynaconf-source]: https://github.com/dynaconf/dynaconf
