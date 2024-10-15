# Use the official python3 image based on Debian 11 "Bullseye".
# https://hub.docker.com/_/python

# The build stage that will be used to deploy to the various environments
# needs to be called `release` in order to integrate with the repo's
# top-level Makefile
FROM python:3.12-slim AS base
# See /documentation/api/package-depedency-management.md#Upgrading Python
# for details on upgrading your Python version

# Install poetry, the package manager.
# https://python-poetry.org
RUN pip install --no-cache-dir poetry==1.5

RUN apt-get update \
    # Install security updates
    # https://pythonspeed.com/articles/security-updates-in-docker/
    && apt-get upgrade --yes \
    && apt-get install --no-install-recommends --yes \
        build-essential \
        libpq-dev \
        postgresql \
        wget \
    # Reduce the image size by clear apt cached lists
    # Complies with https://github.com/codacy/codacy-hadolint/blob/master/codacy-hadolint/docs/description/DL3009.md
    && rm -fr /var/lib/apt/lists/* \
    && rm /etc/ssl/private/ssl-cert-snakeoil.key

ARG RUN_UID
ARG RUN_USER

# The following logic creates the RUN_USER home directory and the directory where
# we will be storing the application in the image. This runs when the user is not root
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
    [ "${RUN_USER}" = "root" ] || \
    (useradd --create-home --create --user-group --home "/home/${RUN_USER}" --uid ${RUN_UID} "${RUN_USER}" \
    && mkdir /api \
    && chown -R ${RUN_UID} "/home/${RUN_USER}" /api)

#-----------
# Dev image
#-----------

FROM base AS dev
ARG RUN_USER

# In between ARG RUN_USER and USER ${RUN_USER}, the user is still root
# If there is anything that needs to be ran as root, this is the spot

# Install graphviz which is used to generate ERD diagrams
RUN apt-get update && apt-get install --no-install-recommends --yes graphviz

USER ${RUN_USER}
WORKDIR /api

COPY pyproject.toml poetry.lock ./
# Explicitly create a new virtualenv to avoid getting overridden by mounted .venv folders
RUN poetry config virtualenvs.in-project false && poetry env use python
# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /api

# Set the host to 0.0.0.0 to make the server available external
# to the Docker container that it's running in.
ENV HOST=0.0.0.0

# Run the application.
CMD ["poetry", "run", "python", "-m", "src"]

#---------
# Release
#---------

FROM base AS release
ARG RUN_USER

# Gunicorn requires this workaround to create writable temporary directory in
# our readonly root file system. https://github.com/aws/containers-roadmap/issues/736
RUN mkdir -p /tmp
VOLUME ["/tmp"]

# TODO(https://github.com/navapbc/template-application-flask/issues/23) Productionize the Docker image

WORKDIR /api

COPY . /api

# Remove any existing virtual environments that might exist. This
# might happen if testing out building the release image from a local machine
# that has a virtual environment within the project api folder.
RUN rm -fr /api/.venv

# Set virtualenv location to be in project to be easy to find
# This will create a virtualenv in /api/.venv/
# See https://python-poetry.org/docs/configuration/#virtualenvsin-project
# See https://python-poetry.org/docs/configuration/#using-environment-variables
ENV POETRY_VIRTUALENVS_IN_PROJECT=true

# Install production runtime dependencies only
RUN poetry install --no-root --only main

# Build the application binary (python wheel) defined in pyproject.toml
# Note that this will only copy over python files, and files stated in the
# include section in pyproject.toml. Also note that if you change the name or
# version section in pyproject.toml, you will need to change the dist/... to match
# or the application will not build
RUN poetry build --format wheel && poetry run pip install 'dist/simpler_grants_gov_api-0.1.0-py3-none-any.whl'

# Add project's virtual env to the PATH so we can directly run poetry scripts
# defiend in pyproject.toml
ENV PATH="/api/.venv/bin:$PATH"

# Set the host to 0.0.0.0 to make the server available external
# to the Docker container that it's running in.
ENV HOST=0.0.0.0

USER ${RUN_USER}

# Run the application.
CMD ["poetry", "run", "gunicorn", "src.app:create_app()"]
