FROM ghcr.io/hhs/python-base-image:4322cc0@sha256:1b55400be929365421d4150638df39ee7345e4c70af713108e01edfd31c48b78 AS base

ARG RUN_UID
ARG RUN_USER
ARG PY_MM=3.13

# Create user and directories using BusyBox applets (scratch-friendly)
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && : "${RUN_UID:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
    if [ "${RUN_USER}" != "root" ]; then \
      /bin/busybox grep -Eq "^${RUN_USER}:" /etc/group || /bin/busybox addgroup -g "${RUN_UID}" "${RUN_USER}"; \
      /bin/busybox grep -Eq "^${RUN_USER}:" /etc/passwd || /bin/busybox adduser -D -H -s /bin/sh -u "${RUN_UID}" -G "${RUN_USER}" "${RUN_USER}"; \
    fi && \
    /bin/busybox mkdir -p "/home/${RUN_USER}" /api /api/tmp /var/spool/mail /tmp /var/tmp /usr/tmp && \
    /bin/busybox chown -R "${RUN_UID}:${RUN_UID}" "/home/${RUN_USER}" /api /api/tmp && \
    /bin/busybox chmod 700 /api/tmp && \
    /bin/busybox chmod 1777 /tmp /var/tmp /usr/tmp

WORKDIR /api

COPY pyproject.toml poetry.lock ./
    
RUN /bin/busybox rm -rf /api/.venv || true
    
ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV VIRTUALENV_ALWAYS_COPY=1



COPY src /api/src
COPY newrelic.ini /api/newrelic.ini

# Build the application wheel and install it into the venv without stripping docstrings (avoid -OO)
# Clean up build artifacts and caches in a single layer to reduce image size
RUN /usr/local/bin/python${PY_MM} -m poetry build --format wheel && \
    /api/.venv/bin/python -m pip install --no-cache-dir dist/simpler_grants_gov_api-0.1.0-py3-none-any.whl && \
    SITE_BASE="/api/.venv/lib/python${PY_MM}/site-packages" && \
    /bin/busybox mkdir -p "${SITE_BASE}/src" && \
    /bin/busybox cp "/api/newrelic.ini" "${SITE_BASE}/src/newrelic.ini" && \
    /bin/busybox cp "/api/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    /bin/busybox chmod 0644 "${SITE_BASE}/src/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    if [ ! -f "${SITE_BASE}/src/newrelic.ini" ]; then \
      echo "ERROR: newrelic.ini missing at ${SITE_BASE}/src/newrelic.ini" >&2; \
      /bin/busybox ls -la "${SITE_BASE}/src" || true; \
      exit 1; \
    fi && \
    /bin/busybox rm -rf /root/.cache "/home/${RUN_USER}/.cache" /tmp/* /var/tmp/* /api/dist /api/src || true

#==============================================
# Stage 3: Dev image
#==============================================
FROM base AS dev
ARG RUN_USER
ARG PY_MM=3.13

# Disable Python optimization to preserve docstrings required by jsonpath_ng
# https://github.com/h2non/jsonpath-ng?tab=readme-ov-file#special-note-about-ply-and-docstrings
ENV PYTHONOPTIMIZE=0
ENV TMPDIR="/tmp"

RUN /bin/busybox mkdir -p /usr/bin && \
    /bin/busybox ln -s /bin/busybox /usr/bin/cat && \
    /bin/busybox ln -s /bin/busybox /usr/bin/ls

USER ${RUN_USER}
WORKDIR /api

# In dev, prefer external venv to avoid mutating release venv
ENV POETRY_VIRTUALENVS_IN_PROJECT=false

COPY pyproject.toml poetry.lock ./

# Explicitly create a new virtualenv
RUN poetry config virtualenvs.in-project false && poetry env use python

# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /api

CMD ["poetry", "run", "flask", "--app", "src.app", "run", "--host", "0.0.0.0", "--port", "8080", "--reload"]

#==============================================
# Stage 5: Minimal release runtime
#==============================================
# hadolint ignore=DL3006
FROM base AS release
ARG PY_MM=3.13

# Working directory already set in base stage
# User already created in base stage

# Copy only the virtualenv and runtime config from base stage
COPY --from=base /api/.venv /api/.venv
COPY --from=base /api/newrelic.ini /api/newrelic.ini


RUN /bin/busybox mkdir -p /usr/bin && \
    /bin/busybox ln -s /bin/busybox /usr/bin/wget && \
    /bin/busybox ln -s /bin/busybox /usr/bin/cat && \
    /bin/busybox ln -s /bin/busybox /usr/bin/ls && \
    /bin/busybox ln -s /bin/busybox /usr/bin/curl

# Clean up to reduce image size:
# - Remove Python bytecode cache files
# - Remove pip cache
# - Remove test files and docs from site-packages
RUN /bin/busybox find /api/.venv -type d -name __pycache__ -exec /bin/busybox rm -rf {} + 2>/dev/null || true && \
    /bin/busybox find /api/.venv -type f -name "*.pyc" -delete 2>/dev/null || true && \
    /bin/busybox find /api/.venv -type f -name "*.pyo" -delete 2>/dev/null || true && \
    /bin/busybox find /api/.venv -type d -name "tests" -exec /bin/busybox rm -rf {} + 2>/dev/null || true && \
    /bin/busybox find /api/.venv -type d -name "test" -exec /bin/busybox rm -rf {} + 2>/dev/null || true && \
    /bin/busybox rm -rf /api/.venv/lib/python${PY_MM}/site-packages/pip /api/.venv/lib/python${PY_MM}/site-packages/setuptools || true

ENV PATH="/api/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/dev/shm" \
    SSL_CERT_FILE="/etc/ssl/certs/ca-certificates.crt" \
    SSL_CERT_DIR="/etc/ssl/certs" \
    PYTHONOPTIMIZE=0

# Run as the non-root user
USER ${RUN_USER}

CMD ["gunicorn", "--worker-tmp-dir=/dev/shm", "src.app:create_app()"]