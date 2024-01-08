# Development

This application is dockerized. Take a look at [Dockerfile](../../api/Dockerfile) to see how it works.

A very simple [docker-compose.yml](../../docker-compose.yml) has been included to support local development and deployment.

## Prerequisites

**Note:** Run everything from within the `/api` folder:

1. Install the version of Python specified in [pyproject.toml](../../api/pyproject.toml)
   [pyenv](https://github.com/pyenv/pyenv#installation) is one popular option for installing Python,
   or [asdf](https://asdf-vm.com/).

2. After installing and activating the right version of Python, install
   [poetry](https://python-poetry.org/docs/#installation) and follow the instructions to add poetry to your path if necessary.

   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. If you are using an M1 mac, you will need to install postgres as well: `brew install postgresql` (The psycopg2-binary is built from source on M1 macs which requires the postgres executable to be present)

4. You'll also need [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Run the application

1. Run `cp frontend/.env.development frontend/.env.local` to create your local copy of the frontend environment variables
2. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running.
3. Run `make -C api setup-local` to install dependencies
4. Run `make -C api init start` to build the image and start the container.
5. Navigate to `localhost:8080/docs` to access the Swagger UI.
6. Run `make -C api run-logs` to see the logs of the running API container
7. Run `make -C api stop` when you are done to delete the container.

## Some Useful Commands

`make test` will run all of the tests. Additional arguments can be passed to this command which will be passed to pytest like so: `make test args="tests/api/route -v"` which would run all tests in the route folder with verbosity increased. See the [Pytest Docs](https://docs.pytest.org/en/7.1.x/reference/reference.html#command-line-flags) for more details on CLI flags you can set.

`make clean-volumes` will spin down the docker containers + delete the volumes. This can be useful to reset your DB, or fix any bad states your local environment may have gotten into.

See the [Makefile](../../api/Makefile) for a full list of commands you can run.

## Docker and Native Development

Several components like tests, linting, and scripts can be run either inside of the Docker container, or outside on your native machine.
Running in Docker is the default, but on some machines like the M1 Mac, running natively may be desirable for performance reasons.

You can switch which way many of these components are run by setting the `PY_RUN_APPROACH` env variable in your terminal.

* `export PY_RUN_APPROACH=local` will run these components natively
* `export PY_RUN_APPROACH=docker` will run these within Docker

Note that even with the native mode, many components like the DB and API will only ever run in Docker, and you should always make sure that any implementations work within docker.

Running in the native/local approach may require additional packages to be installed on your machine to get working.

## Environment Variables

Most configuration options are managed by environment variables.

Environment variables for local development are stored in the [local.env](../../api/local.env) file. This file is automatically loaded when running. If running within Docker, this file is specified as an `env_file` in the [docker-compose](../../docker-compose.yml) file, and loaded [by a script](../../api/src/util/local.py) automatically when running most other components outside the container.

Any environment variables specified directly in the [docker-compose](../../docker-compose.yml) file will take precedent over those specified in the [local.env](../../api/local.env) file.

## Authentication

This API uses a very simple [ApiKey authentication approach](https://apiflask.com/authentication/#use-external-authentication-library) which requires the caller to provide a static key. This is specified with the `API_AUTH_TOKEN` environment variable.

## Next steps

Now that you're up and running, read the [application docs](../../api/README.md) to familiarize yourself with the application.
