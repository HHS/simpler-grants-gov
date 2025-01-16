# Developer Getting Started Guide 

> [!NOTE]
> All of the steps on this page should be run from the root of the [`analytics/`](../../analytics/) directory

## Development Environment Setup 

### Docker vs Native

This package runs in Docker by default, but can also be configured to run natively without Docker. Choose the option that's best for you, and then follow the instructions for that option:

- [Run with Docker](#run-with-docker)
- [Run Natively](#run-natively)

#### Run with Docker

**Pre-requisites**

- **Docker** installed and running locally: `docker --version`
- **Docker compose** installed: `docker-compose --version`

**Steps**

1. Run `make build`
2. Acquire a GitHub Token using one of the methods below
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
3. Add `GH_TOKEN=...` to your environment variables, e.g. in .zshrc or .bashrc
4. Run `make test-audit` to confirm the application is running correctly.
5. Proceed to next section to learn how to invoke commands 

#### Run Natively

**Pre-requisites**

- **Python version 3.12:** [pyenv](https://github.com/pyenv/pyenv#installation) is one popular option for installing Python, or [asdf](https://asdf-vm.com/)
- **Poetry:** [install poetry with the official installer](https://python-poetry.org/docs/#installing-with-the-official-installer) or alternatively use [pipx to install](https://python-poetry.org/docs/#installing-with-pipx)
- **GitHub CLI:** [Install the GitHub CLI](https://github.com/cli/cli#installation)

**Steps**

1. Add PY_RUN_APPROACH=local to your environment variables, e.g. in .zshrc or .bashrc
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
5. Run `make test-audit` to confirm the application is running correctly.

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

### How To Add New Dataset

1. Create a new python file in `src/analytics/datasets/`.
2. In that file, create a new class that inherits from the `BaseDataset`.
3. Store the names of key columns as either class or instance attributes.
4. If you need to combine multiple source files (or other datasets) to produce this dataset, consider creating a class method that can be used to instantiate this dataset from those sources.
5. Create **at least** one unit test for each method that is implemented with the new class.

### How To Add New CLI Entrypoint

1. Add a new function to [`cli.py`](../../analytics/src/analytics/cli.py)
2. Wrap this function with a [sub-command `typer` decorator](https://typer.tiangolo.com/tutorial/subcommands/single-file/). 
3. If the function accepts parameters, [annotate those parameters](https://typer.tiangolo.com/tutorial/options/name/).
4. Add *at least* one unit test for the CLI entrypoint, optionally mocking potential side effects of calling the entrypoint.

### How To Copy Table from grants-db to analytics-db

1. Add a new sql migration file in `src/analytics/integrations/etldb/migrations/versions` and prefix file name with the next iteration number (ex: `0007`).
2. Use your database management system(ex: `pg_admin`, `db_beaver`...) and right-click on the table you wish to copy and select `SQL scripts` then `request and copy original DDL` 
3. Paste the DDL in your new migration file. Fix any formating issues, see previous migration files for reference.
4. Remove all reference to schema, roles, triggers and the use of `default now()` for timestamp columns.

    Example: 
    ``` sql 
    create table if not exists opi.opportunity
    ( 
     ...,
     created_at              timestamp with time zone default now() not null,
     ...
    )
    ```
    should be
    ``` sql 
    CREATE TABLE IF NOT EXISTS opportunity;
    ( 
     ...,
     created_at              timestamp with time zone not null
     ...
    )
      ```

5. Run migration via `make db-migrate` command

