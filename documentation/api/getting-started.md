# Getting started

This application is dockerized. Take a look at [Dockerfile](/api/Dockerfile) to see how it works.

A very simple [docker-compose.yml](/docker-compose.yml) has been included to support local development and deployment. Take a look at [docker-compose.yml](/docker-compose.yml) for more information.

## Prerequisites

**Note:** Run everything from within the `/api` folder:

1. Install the version of Python specified in [.python-version](/api/.python-version)
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

1. In your terminal, `cd` to the `api` directory of this repo.
2. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed & running.
3. Run `make setup-local` to install dependencies
4. Run `make init start` to build the image and start the container.
5. Navigate to `localhost:8080/docs` to access the Swagger UI.
6. Run `make run-logs` to see the logs of the running API container
7. Run `make stop` when you are done to delete the container.

## Next steps

Now that you're up and running, read the [application docs](README.md) to familiarize yourself with the application.
