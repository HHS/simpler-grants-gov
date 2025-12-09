
FROM ghcr.io/hhs/python-base-image:868756e@sha256:f1ee3ce8b993a266c6721d6c024b2e41b8aa4a70199536ead1f4b0b5fc18d33c AS base
ARG RUN_UID
ARG RUN_USER

# Read Python version from the version file in the base image
RUN mkdir -p /tmp && cat /python-version.txt > /tmp/py_version.txt

# Create user and directories
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && : "${RUN_UID:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
    if [ "${RUN_USER}" != "root" ]; then \
      grep -Eq "^${RUN_USER}:" /etc/group || groupadd -g "${RUN_UID}" "${RUN_USER}"; \
      grep -Eq "^${RUN_USER}:" /etc/passwd || useradd -l -M -s /bin/bash -u "${RUN_UID}" -g "${RUN_USER}" "${RUN_USER}"; \
    fi && \
    mkdir -p "/home/${RUN_USER}" /analytics /analytics/tmp /var/spool/mail /tmp /var/tmp /usr/tmp && \
    chown -R "${RUN_UID}:${RUN_UID}" "/home/${RUN_USER}" /analytics /analytics/tmp && \
    chmod 700 /analytics/tmp && \
    chmod 1777 /tmp /var/tmp /usr/tmp

# Set PYTHONPATH so that the tests can find the source code.
ENV PYTHONPATH="/analytics/src/:$PYTHONPATH"

WORKDIR /analytics

COPY pyproject.toml poetry.lock ./

RUN rm -rf /analytics/.venv || true

ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV VIRTUALENV_ALWAYS_COPY=1
ENV VIRTUALENV_APP_DATA="/tmp"

COPY src /analytics/src
COPY newrelic.ini /analytics/newrelic.ini
COPY README.md /analytics/README.md
COPY config.py /analytics/config.py

# Install dependencies and build the application wheel
# Clean up build artifacts and caches in a single layer to reduce image size
RUN PY_MM=$(cat /tmp/py_version.txt) && \
    /usr/local/bin/python"${PY_MM}" -m poetry install --only main --no-root && \
    /usr/local/bin/python"${PY_MM}" -m poetry build --format wheel && \
    /analytics/.venv/bin/pip install --no-cache-dir dist/simpler_grants_gov_analytics-0.1.0-py3-none-any.whl && \
    /analytics/.venv/bin/python -m pip install --no-cache-dir "virtualenv>=20.35.3" && \
    SITE_BASE="/analytics/.venv/lib/python${PY_MM}/site-packages" && \
    mkdir -p "${SITE_BASE}/src" && \
    cp "/analytics/newrelic.ini" "${SITE_BASE}/src/newrelic.ini" && \
    cp "/analytics/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    chmod 0644 "${SITE_BASE}/src/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    cp "/analytics/config.py" "${SITE_BASE}/config.py" && \
    chmod 0644 "${SITE_BASE}/config.py" && \
    if [ ! -f "${SITE_BASE}/src/newrelic.ini" ]; then \
      echo "ERROR: newrelic.ini missing at ${SITE_BASE}/src/newrelic.ini" >&2; \
      ls -la "${SITE_BASE}/src" || true; \
      exit 1; \
    fi; \
    (find /tmp -mindepth 1 ! -name 'py_version.txt' -delete 2>/dev/null || true) && \
    (rm -rf /root/.cache "/home/${RUN_USER}/.cache" /var/tmp/* /analytics/dist /analytics/src /analytics/config.py /analytics/README.md || true)

#-----------
# Dev image
#-----------
FROM base AS dev
ARG RUN_USER

# Disable Python optimization to preserve docstrings required by jsonpath_ng
# https://github.com/h2non/jsonpath-ng?tab=readme-ov-file#special-note-about-ply-and-docstrings
ENV PYTHONOPTIMIZE=0
ENV TMPDIR="/tmp"

USER ${RUN_USER}
WORKDIR /analytics

ENV POETRY_VIRTUALENVS_IN_PROJECT=false

COPY pyproject.toml poetry.lock ./

RUN poetry config virtualenvs.in-project false && poetry env use python
# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /analytics

#---------
# Release
#---------
FROM base AS release
ARG RUN_USER

# Working directory already set in base stage
# User already created in base stage

# Copy only the virtualenv and runtime config from base stage
COPY --from=base /analytics/.venv /analytics/.venv
COPY --from=base /analytics/newrelic.ini /analytics/newrelic.ini
COPY --from=base /tmp/py_version.txt /tmp/py_version.txt

# Copy Makefile and config directory for scheduled jobs that use make targets
COPY Makefile /analytics/Makefile
COPY config /analytics/config

# Copy pyproject.toml and src for poetry run support
COPY pyproject.toml /analytics/pyproject.toml
COPY src /analytics/src

ENV PATH="/analytics/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/tmp" \
    SSL_CERT_FILE="/etc/pki/tls/certs/ca-bundle.crt" \
    SSL_CERT_DIR="/etc/pki/tls/certs" \
    PYTHONOPTIMIZE=0

USER ${RUN_USER}
