# Development

This application is dockerized. Take a look at [Dockerfile](../../api/Dockerfile) to see how it works.

A very simple [docker-compose.yml](../../docker-compose.yml) has been included to support local development and deployment.

Several components like tests, linting, and scripts can be run either inside of the Docker container, or outside on your  machine.

**Running in Docker is the default**, but on some machines like the M1 Mac, running natively may be desirable for performance reasons.

If you are looking to develop using a Windows computer, see [windows-setup.md](./windows-setup.md) for installation and development instructions.

## Docker

This section covers development using Docker. There are a number of Docker commands included in the [Makefile](../../api/Makefile) which are helpful for local development. Run `make help` for a list of commands.

### Setup

The following must be installed in order to run the API locally, these instructions
focus on setting up on a Mac, but most of this would be applicable regardless of system
although the installation method will vary. The exact approach detailed here may not
match exactly what you do, it's one way of getting the tools, some have multiple installation methods.

* Install [xcode-select](https://developer.apple.com/documentation/xcode/installing-the-command-line-tools/) - these are the developer tools needed for most command line tools.
* Install [Homebrew](https://brew.sh/) - for installing several packages
* Install [postgres](https://www.postgresql.org/download/macosx/) - Can use brew, make sure to specify the version in our docker-compose (eg. `brew install postgresql@17`)
* Install [libpq](https://formulae.brew.sh/formula/libpq) - Postgres utils, including one used by a script to verify the DB is ready
* Install [docker](https://docs.docker.com/engine/install/)
* Install [poetry](https://python-poetry.org/docs/) - For managing packages

These aren't required, but relevant:
* Install [git](https://git-scm.com/install/mac)
* Install [pyenv](https://github.com/pyenv/pyenv?tab=readme-ov-file#installation) - for managing multiple python versions / makes upgrading python much easier

---

Run `make init && make run-logs` to start the local containers and watch logs. The application will be available at `http://localhost:8080` and API documentation at `http://localhost:8080/docs`.

If you would prefer not to watch logs, you can use `make init && make start`.

This stands up the following services:

* Flask API (http://localhost:8080)
* Postgres database
* OpenSearch node
* OpenSearch Dashboard (http://localhost:5601)
* [localstack](https://www.localstack.cloud) for mocking s3/sqs actions locally
* [mock oauth2 server](https://github.com/navikt/mock-oauth2-server) (http://localhost:5001)


> [!NOTE]
> `make init` runs through and sets up every service.
> If one isn't running, run `make init`, you usually don't need to run
> many of the direct setup commands unless you are reworking our local setup.


### Seed data

Run `make setup-api-data` to create local data in the database, search index  and make it available in the API. This basically creates everything; if you want to be selective about what data you're seeding, see the Makefile for ways you can populate selective data.

### API Authentication

This API uses a very simple [ApiKey authentication approach](https://apiflask.com/authentication/#use-external-authentication-library) which requires the caller to provide a static key. This is specified with the `API_AUTH_TOKEN` environment variable.

### User Authentication

Run `make setup-env-override-file` to create the `override.env` file which will include the necessary JWT keys for running user authentication within the app.

Note that this runs as part of `make init` so generally does not need to be done separately.

### Accessing the API through swagger docs

To see the current API definiton, you can go to the local [swagger docs](http://localhost:8080/docs).

Each endpoint specifies which auth token it needs behind the lock icon. The `ApiJwtAuth` token is printed as part of user creation in `make setup-api-data`, search for `create_jwt_for_user` to see the `auth.token_id` value. For the `ApiUserKeyAuth` token, search for `X-API-Key` for the different values for each role (hint: they typically are the user name + \_key, for instance `one_org_user` the key value is `one_org_user_key`). You can set these tokens per end point, or set them globally at the top on the lock icon labeled Authorize.

For more on auth tokens, see [authentication.md](./authentication.md)

#### Mock Oauth2 Server

A mock Oauth2 server is defined and managed in the API's [docker-compose.yml](../../api/docker-compose.yml) file. It creates a mock endpoint that is configured to work with the API to stand in for login.gov for local development, and is available at `http://localhost:5001` when running the API containers.

### Environment Variables

Most configuration options are managed by environment variables.

Environment variables for local development are stored in the [local.env](../../api/local.env) file. This file is automatically loaded when running. If running within Docker, this file is specified as an `env_file` in the [docker-compose](../../docker-compose.yml) file, and loaded [by a script](../../api/src/util/local.py) automatically when running most other components outside the container.

Any environment variables specified directly in the [docker-compose](../../docker-compose.yml) file will take precedent over those specified in the [local.env](../../api/local.env) file.

### Troubleshooting

Errors in standing up the API can originate from an out of date container, database syncronization, or other issues with previously created services. Helper functions are available to rebuild:

* **db-check-migrations** - check if migrations are out of sync
* **volume-recreate** - delete all existing volumes and data
* **remake-backend** - delete all data (`volume-recreate`) and load data (`db-seed-local` and `populate-search-opportunities`)
   - Note this drops all data in the DB and fully remakes it. If you are missing data, try just running `make db-seed-local` first.
   - This script should be seen as a last resort for getting the API into a healthy state.

### VSCode Remote Attach Container Debugging

The API can be run in debug mode that allows for remote attach debugging (currently only supported from VSCode) to the container.

- Requirements:

  - VSCode Python extension
  - Updated Poetry with the `debugpy` dev package in `pyproject.toml`

- See `./vscode/launch.json` which has the debug config. (Named `API Remote Attach`)

- Start the server in debug mode via `make start-debug` or `make start-debug run-logs`.

  - This will start the `main-app` service with port 5678 exposed.

- The server will start in waiting mode, waiting for you to attach the debugger (see `/src/app.py`) before continuing to run.

- Go to your VSCode debugger window and run the `API Remote Attach` option

- You should now be able to hit set breakpoints throughout the API

## Local (non-Docker)

Run `export PY_RUN_APPROACH=local` to run API and test functions locally when running commands in the Makefile. For example, `make test` or `make format` will run outside of Docker.

**Note:** even with the native mode, many components like the DB and API will only ever run in Docker, and you should always make sure that any implementations work within Docker.

Running in the native/local approach may require additional packages to be installed on your machine to get working.

### Prerequisites

1. Install the version of Python specified in [pyproject.toml](../../api/pyproject.toml)
   [pyenv](https://github.com/pyenv/pyenv#installation) is one popular option for installing Python,
   or [asdf](https://asdf-vm.com/).
   - If using pyenv run `pyenv local <version>` to ensure that version will be used in subsequent steps
2. Ensure that `python -V` and `python3 -V` are picking up that version.
   - If not, run `pyenv init -` and/or restart your shell to ensure it was run automatically
3. After installing and activating the right version of Python, install
   [poetry](https://python-poetry.org/docs/#installation) and follow the instructions to add poetry to your path if necessary.

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

4. This still requires Docker as the database and services all still run within Docker.
5. Certain environment variables require different paths when running outside of Docker.
   You can handle this by setting these into your `override.env` file.

```dotenv
DB_HOST=localhost
S3_ENDPOINT_URL=http://localhost:4566
LOGIN_GOV_JWK_ENDPOINT=http://localhost:5001/issuer1/jwks

SEARCH_ENDPOINT=localhost
OPENSEARCH_HOST=localhost

# This needs to be set explicitly as "export PY_RUN_APPROACH=local"
# in your shell, or via some other mechanism - setting it here won't work.
PY_RUN_APPROACH=local
```

**Note:** All the following commands should be run from the `/api` directory.

### Database setup: Run Migrations/Seeds

If you haven't done local development before you'll need to execute the migrations and seed the DB with data using the steps in [database-local-usage.md](database/database-local-usage.md)

### Services

Individual services can be run through Docker, which can be useful in concert with non-Docker application development:

* **OpenSearch**
  * Run `make init-opensearch` setup the OpenSearch Container
  * Run `make populate-search-opportunities` to push data previously seeded in the DB into the search index

  If your DB or OpenSearch end up in an odd place, you can reset all the persistent storage using `make volume-recreate`.

* **Localstack (local s3)**
   * Run `make init-localstack`
* **Mock OAuth server**
   * Run `make init-mock-oauth2`

## Next steps

Now that you're up and running, read the [application docs](../../api/README.md) to familiarize yourself with the application.
