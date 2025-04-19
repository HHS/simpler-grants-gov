# Getting Started Guide for Developers

> [!NOTE]
> All of the steps on this page should be run from the root of the [`analytics/`](../../analytics/) directory

## Install Prerequisites 

This package runs in Docker by default.

**Prerequisites**

- **Docker** [Installation options](https://docs.docker.com/desktop/setup/install/mac-install/) 
- **Python version 3.12:** [pyenv](https://github.com/pyenv/pyenv#installation) is one popular option for installing Python, or [asdf](https://asdf-vm.com/)
- **Poetry:** [Install poetry with the official installer](https://python-poetry.org/docs/#installing-with-the-official-installer) or alternatively use [pipx to install](https://python-poetry.org/docs/#installing-with-pipx)
- **GitHub CLI:** [Install the GitHub CLI](https://github.com/cli/cli#installation)
- **Postgres:** [Installation options for macOS](https://www.postgresql.org/download/macosx/)
- **Psycopg:** [Installation options](https://www.psycopg.org/psycopg3/docs/basic/install.html)

## Install the Package

**Steps**

1. Install all prerequisites
2. Set up the project: `make install` -- This will install the required packages and prompt you to authenticate with GitHub
3. Acquire a GitHub Token using one of the methods below
  - Via AWS (Project Team)
    - Retrieve GH_TOKEN from [AWS](https://us-east-1.console.aws.amazon.com/systems-manager/parameters/%252Fanalytics%252Fgithub-token/description?region=us-east-1&tab=Table#list_parameter_filters=Name:Contains:analytics%2Fgithub-token)
  - Create your own in GitHub (Open Source)
    - Go to https://github.com/settings/tokens
    - Generate a new token (classic)
    - Give it the following scopes:
      - repo
      - read:org
      - admin:public_key
      - project
4. Add `GH_TOKEN=...` to your environment variables, e.g. in .zshrc or .bashrc
5. If running natively, add PY_RUN_APPROACH=local to your environment variables
6. Edit `local.env` and set the value of DB_HOST accordingly
7. Run `make test-audit` to confirm the application is running correctly

## Start the Services

```bash
cd simpler-grants-gov/analytics
docker-compose up -d
```

## Invoke Commands on the Service

### Using `make` 

Several `make` commands are defined in the project [`Makefile`](../../analytics/Makefile). Commands can be invoked from the command line, as in the following examples:

- `make install` - Checks that prereqs are installed, installs new dependencies, and prompts for GitHub authentication
- `make unit-test` - Runs the unit tests and opens a coverage report in a web browser
- `make e2e-test` - Runs integration and end-to-end tests and opens a coverage report in a web browser
- `make lint` - Runs [linting and formatting checks](formatting-and-linting.md)

### Using the CLI 

The package includes a CLI that can be used to discover the available commands. To run the CLI, type `poetry run analytics --help` at the command line, and the CLI should respond with a list of available commands.

![Screenshot of passing the --help flag to CLI entry point](../../analytics/static/screenshot-cli-help.png)

## Example Development Tasks

### How To Access Dockerized Postgres DB from MacOS Terminal

1. Start the database container: `sudo docker-compose up -d`
2. Ensure container is running: `docker-compose ls`
3. Get your IP address, which will be used in next step: `ifconfig -u | grep 'inet ' | grep -v 127.0.0.1 | cut -d\  -f2 | head -1` (this will display a value similar to `10.0.1.101`)
4. Launch the terminal-based front-end to Postgres: `psql -h 10.0.1.101 -p 5432 -U app -W app` (use IP address from previous step for the value of `-h` arg)
5. Type a PostgresSQL command, e.g.: `\dir`.

### How To Add New Dataset

1. Create a new python file in `src/analytics/datasets/`
2. In that file, create a new class that inherits from the `BaseDataset`
3. Store the names of key columns as either class or instance attributes
4. If you need to combine multiple source files (or other datasets) to produce this dataset, consider creating a class method that can be used to instantiate this dataset from those sources
5. Create **at least** one unit test for each method that is implemented with the new class

### How To Add New CLI Entrypoint

1. Add a new function to [`cli.py`](../../analytics/src/analytics/cli.py)
2. Wrap this function with a [sub-command `typer` decorator](https://typer.tiangolo.com/tutorial/subcommands/single-file/) 
3. If the function accepts parameters, [annotate those parameters](https://typer.tiangolo.com/tutorial/options/name/)
4. Add *at least* one unit test for the CLI entrypoint, optionally mocking potential side effects of calling the entrypoint

### How to Extend Analytics DB Schema

1. Add a new migration file to [`integrations/etldb/migrations/versions/`](../../analytics/src/analytics/integrations/etldb/migrations/versions) and prefix file name with the next iteration number (ex: `0007_`)
2. Add valid Postgres SQL to the new integration file
3. Run the migration command: `make db-migrate` 

### How To Run Linters

```bash
make lint
```

### How To Run Unit Tests

```bash
make unit-test
```

### Troubleshoot: How To Run Metabase on Apple Silicon

On a MacBook Pro with M3 chip, if the Metabase service (i.e. `grants-metabase`)
fails to launch and/or crashes after `docker compose up`, refer to the following 
article: [How To Run Metabase with Docker on Apple Silicon](./run-metabase-on-apple-silicon.md)

