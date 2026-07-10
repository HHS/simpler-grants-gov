FROM ghcr.io/hhs/python-base-image:a0609d9@sha256:b7f83174c1b6da6592441a07f3dc3389f881ce5146489ce9286d01d7aa455b9b AS base

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
    mkdir -p "/home/${RUN_USER}" /api /api/tmp /var/spool/mail /tmp /var/tmp /usr/tmp /opt/venv && \
    chown -R "${RUN_UID}:${RUN_UID}" "/home/${RUN_USER}" /api /api/tmp /opt/venv && \
    chmod 700 /api/tmp && \
    chmod 1777 /tmp /var/tmp /usr/tmp /opt/venv

WORKDIR /api

COPY pyproject.toml uv.lock ./

RUN rm -rf /api/.venv || true

COPY src /api/src
COPY newrelic.ini /api/newrelic.ini

COPY gunicorn.conf.py /api/gunicorn.conf.py

# Disable dev dependencies in UV sync
ENV UV_NO_DEV=1
# Compile python to *.pyc files for performance
ENV UV_COMPILE_BYTECODE=1
ENV UV_CACHE_DIR="/tmp/.cache/uv"
ENV UV_NO_SYNC=1

# Build the application wheel and install it into the venv without stripping docstrings (avoid -OO)
# Clean up build artifacts and caches in a single layer to reduce image size
RUN set -e && PY_MM=$(cat /tmp/py_version.txt) && \
    uv sync --locked --no-dev && \
    uv build --wheel && \
    uv pip install --no-cache-dir dist/simpler_grants_gov_api-0.1.0-py3-none-any.whl && \
    uv pip install --no-cache-dir "virtualenv>=20.35.3" && \
    SITE_BASE="/api/.venv/lib/python${PY_MM}/site-packages" && \
    mkdir -p "${SITE_BASE}/src" && \
    cp "/api/newrelic.ini" "${SITE_BASE}/src/newrelic.ini" && \
    cp "/api/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    chmod 0644 "${SITE_BASE}/src/newrelic.ini" "${SITE_BASE}/newrelic.ini" && \
    if [ ! -f "${SITE_BASE}/src/newrelic.ini" ]; then \
      echo "ERROR: newrelic.ini missing at ${SITE_BASE}/src/newrelic.ini" >&2; \
      ls -la "${SITE_BASE}/src" || true; \
      exit 1; \
    fi && \
    (find /tmp -mindepth 1 ! -name 'py_version.txt' -delete 2>/dev/null || true) && \
    (rm -rf /root/.cache "/home/${RUN_USER}/.cache" /var/tmp/* /api/dist /api/src || true)

#==============================================
# Stage 2: Dev image
#==============================================
FROM base AS dev
ARG RUN_USER

# We want dev dependencies in the dev image
ENV UV_NO_DEV=0
# In dev, prefer external venv to avoid mutating release venv
ENV VIRTUAL_ENV=/opt/venv
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
# Place entry points in the environment at the front of the path
ENV PATH="/opt/venv/bin:$PATH"

# Disable Python optimization to preserve docstrings required by jsonpath_ng
# https://github.com/h2non/jsonpath-ng?tab=readme-ov-file#special-note-about-ply-and-docstrings
ENV PYTHONOPTIMIZE=0
ENV TMPDIR="/tmp"

USER ${RUN_USER}
WORKDIR /api

COPY pyproject.toml uv.lock ./

COPY . /api

# Install all dependencies including dev dependencies
RUN uv venv /opt/venv && uv sync --locked --all-groups


CMD ["flask", "--app", "src.app", "run", "--host", "0.0.0.0", "--port", "8080", "--reload"]

#==============================================
# Stage 3: Minimal release runtime
#==============================================
# hadolint ignore=DL3006
FROM base AS release

# Working directory already set in base stage
# User already created in base stage

# Copy only the virtualenv and runtime config from base stage
COPY --from=base /api/.venv /api/.venv
COPY --from=base /api/newrelic.ini /api/newrelic.ini
COPY --from=base /tmp/py_version.txt /tmp/py_version.txt

# Fix /tmp permissions - COPY --from creates parent directories as root with
# default permissions (755), overriding the 1777 set in the base stage
RUN chmod 1777 /tmp

# Clean up to reduce image size:
# - Remove Python bytecode cache files
# - Remove pip cache
# - Remove test files and docs from site-packages
RUN PY_MM=$(cat /tmp/py_version.txt) && \
    (find /api/.venv -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true) && \
    (find /api/.venv -type f -name "*.pyc" -delete 2>/dev/null || true) && \
    (find /api/.venv -type f -name "*.pyo" -delete 2>/dev/null || true) && \
    (find /api/.venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true) && \
    (find /api/.venv -type d -name "test" -exec rm -rf {} + 2>/dev/null || true) && \
    rm -rf \
      /api/.venv/lib/python"${PY_MM}"/site-packages/pip* \
      /api/.venv/lib/python"${PY_MM}"/site-packages/setuptools* \
      /api/.venv/lib/python"${PY_MM}"/site-packages/_distutils_hack \
      /api/.venv/lib/python"${PY_MM}"/site-packages/pip-*.dist-info \
      /api/.venv/lib/python"${PY_MM}"/site-packages/setuptools-*.dist-info \
      /api/.venv/bin/pip* \
      /api/.venv/bin/easy_install* \
      /root/.local/share/virtualenv \
      /opt/venv \
      "/home/${RUN_USER}/.local/share/virtualenv" || true

ENV PATH="/api/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/tmp" \
    SSL_CERT_FILE="/etc/pki/tls/certs/ca-bundle.crt" \
    SSL_CERT_DIR="/etc/pki/tls/certs" \
    PYTHONOPTIMIZE=0

# Run as the non-root user
USER ${RUN_USER}

# `-c gunicorn.conf.py` is technically redundant: gunicorn auto-loads ./gunicorn.conf.py
# from the WORKDIR (/api) when the file is present. We pass it explicitly as a guardrail --
# if the config is ever dropped from the image again, gunicorn fails fast at startup
# instead of silently falling back to its defaults (1 sync worker, 1 thread).
CMD ["gunicorn", "-c", "gunicorn.conf.py", "--worker-tmp-dir=/dev/shm", "src.app:create_app()", "--log-level", "debug"]
