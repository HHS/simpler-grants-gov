# Use the official python3 image based on Debian 11 "Bullseye".
# https://hub.docker.com/_/python

# The build stage that will be used to deploy to the various environments
# needs to be called `release` in order to integrate with the repo's
# top-level Makefile
FROM python:3.13-slim AS base

# Install poetry, the package manager.
# https://python-poetry.org

RUN python -m pip install --no-cache-dir --upgrade "pip==25.3"
RUN python -m pip install --no-cache-dir --upgrade "poetry==1.8.2"

RUN apt-get update && \
    apt-get remove --yes \
    build-essential \
    libc-dev \
    libpq-dev \
    postgresql \
    wget  \
    && apt-get upgrade --yes  \
    && apt-get install --no-install-recommends --yes \
    build-essential \
    libc-dev \
    libpq-dev \
    postgresql \
    wget \
    libgnutls30 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm /etc/ssl/private/ssl-cert-snakeoil.key
RUN rm -rf /root/.cache/pip || true
# Ensure no stale pip 25.2 dist-info remains from base image
RUN rm -rf /usr/local/lib/python3.13/site-packages/pip-25.2.dist-info || true

ARG RUN_UID
ARG RUN_USER

# The following logic creates the RUN_USER home directory and the directory where
# we will be storing the application in the image. This runs when the user is not root
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
  [ "${RUN_USER}" = "root" ] || \
  (useradd --create-home --create --user-group --home "/home/${RUN_USER}" --uid ${RUN_UID} "${RUN_USER}" \
  && mkdir /analytics \
  && chown -R ${RUN_UID} "/home/${RUN_USER}" /analytics)

# Set PYTHONPATH so that the tests can find the source code.
ENV PYTHONPATH="/analytics/src/:$PYTHONPATH"

#-----------
# Dev image
#-----------

FROM base AS dev
ARG RUN_USER

# In between ARG RUN_USER and USER ${RUN_USER}, the user is still root
# If there is anything that needs to be ran as root, this is the spot

USER ${RUN_USER}
WORKDIR /analytics

COPY pyproject.toml poetry.lock ./
# Explicitly create a new virtualenv to avoid getting overridden by mounted .venv folders
RUN poetry config virtualenvs.in-project false && poetry env use python
# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /analytics

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

WORKDIR /analytics

COPY . /analytics

# Remove any existing virtual environments that might exist. This
# might happen if testing out building the release image from a local machine
# that has a virtual environment within the project analytics folder.
RUN rm -fr /analytics/.venv

# Set virtualenv location to be in project to be easy to find
# This will create a virtualenv in /analytics/.venv/
# See https://python-poetry.org/docs/configuration/#virtualenvsin-project
# See https://python-poetry.org/docs/configuration/#using-environment-variables
ENV POETRY_VIRTUALENVS_IN_PROJECT=true

# Create virtualenv and upgrade pip inside it to 25.3 before installing deps
RUN poetry env use python && poetry run pip install --no-cache-dir --upgrade "pip==25.3"

# Install production runtime dependencies only
RUN poetry install --no-root --only main

# Build the application binary (python wheel) defined in pyproject.toml
# Note that this will only copy over python files, and files stated in the
# include section in pyproject.toml.
RUN poetry build --format wheel && \
  poetry run pip install --no-cache-dir dist/*.whl && \
  poetry run python -m pip install --no-cache-dir --upgrade "pip==25.3" && \
  find /analytics/.venv -type d -name 'pip-25.2.dist-info' -prune -exec rm -rf {} + && \
  rm -rf /root/.local/share/virtualenv /root/.cache/pip /usr/local/share/python-wheels || true

# Add project's virtual env to the PATH so we can directly run poetry scripts
# defiend in pyproject.toml
ENV PATH="/analytics/.venv/bin:$PATH"


USER ${RUN_USER}
