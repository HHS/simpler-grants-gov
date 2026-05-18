FROM ghcr.io/hhs/python-base-image:8ae2ecf@sha256:33d915d6da8c2c4049537fb5a5a209fb6af0a2b7009c524c3474631b57510864 AS base

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
    mkdir -p "/home/${RUN_USER}" /grants_shared /grants_shared/tmp /var/spool/mail /tmp /var/tmp /usr/tmp /opt/venv && \
    chown -R "${RUN_UID}:${RUN_UID}" "/home/${RUN_USER}" /grants_shared /grants_shared/tmp /opt/venv && \
    chmod 700 /grants_shared/tmp && \
    chmod 1777 /tmp /var/tmp /usr/tmp /opt/venv

WORKDIR /grants_shared

COPY pyproject.toml uv.lock ./

RUN rm -rf /grants_shared/.venv || true

COPY src /grants_shared/src

# Disable dev dependencies in UV sync
ENV UV_NO_DEV=1
# Compile python to *.pyc files for performance
ENV UV_COMPILE_BYTECODE=1
ENV UV_CACHE_DIR="/tmp/.cache/uv"
ENV UV_NO_SYNC=1

# Build the application wheel and install it into the venv without stripping docstrings (avoid -OO)
# Clean up build artifacts and caches in a single layer to reduce image size
# TODO - as we upgrade the package version, the wheel will need to be adjusted every time
#        is there a way around that?
RUN set -e && PY_MM=$(cat /tmp/py_version.txt) && \
    uv sync --locked --no-dev && \
    uv build --wheel && \
    uv pip install --no-cache-dir dist/grants_shared-0.1.0-py3-none-any.whl && \
    uv pip install --no-cache-dir "virtualenv>=20.35.3" && \
    SITE_BASE="/grants_shared/.venv/lib/python${PY_MM}/site-packages" && \
    mkdir -p "${SITE_BASE}/src" && \
    (find /tmp -mindepth 1 ! -name 'py_version.txt' -delete 2>/dev/null || true) && \
    (rm -rf /root/.cache "/home/${RUN_USER}/.cache" /var/tmp/* /grants_shared/dist /grants_shared/src || true)


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
WORKDIR /grants_shared

COPY pyproject.toml uv.lock ./

COPY . /grants_shared

# Install all dependencies including dev dependencies
RUN uv venv /opt/venv && uv sync --locked --all-groups


#==============================================
# Stage 3: Minimal release runtime
#==============================================
# hadolint ignore=DL3006
FROM base AS release

# Working directory already set in base stage
# User already created in base stage

# Copy only the virtualenv and runtime config from base stage
COPY --from=base /grants_shared/.venv /grants_shared/.venv
COPY --from=base /tmp/py_version.txt /tmp/py_version.txt

# Fix /tmp permissions - COPY --from creates parent directories as root with
# default permissions (755), overriding the 1777 set in the base stage
RUN chmod 1777 /tmp

# Clean up to reduce image size:
# - Remove Python bytecode cache files
# - Remove pip cache
# - Remove test files and docs from site-packages
RUN PY_MM=$(cat /tmp/py_version.txt) && \
    (find /grants_shared/.venv -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true) && \
    (find /grants_shared/.venv -type f -name "*.pyc" -delete 2>/dev/null || true) && \
    (find /grants_shared/.venv -type f -name "*.pyo" -delete 2>/dev/null || true) && \
    (find /grants_shared/.venv -type d -name "tests" -exec rm -rf {} + 2>/dev/null || true) && \
    (find /grants_shared/.venv -type d -name "test" -exec rm -rf {} + 2>/dev/null || true) && \
    rm -rf \
      /grants_shared/.venv/lib/python"${PY_MM}"/site-packages/pip* \
      /grants_shared/.venv/lib/python"${PY_MM}"/site-packages/setuptools* \
      /grants_shared/.venv/lib/python"${PY_MM}"/site-packages/_distutils_hack \
      /grants_shared/.venv/lib/python"${PY_MM}"/site-packages/pip-*.dist-info \
      /grants_shared/.venv/lib/python"${PY_MM}"/site-packages/setuptools-*.dist-info \
      /grants_shared/.venv/bin/pip* \
      /grants_shared/.venv/bin/easy_install* \
      /root/.local/share/virtualenv \
      /opt/venv \
      "/home/${RUN_USER}/.local/share/virtualenv" || true

ENV PATH="/grants_shared/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/tmp" \
    SSL_CERT_FILE="/etc/pki/tls/certs/ca-bundle.crt" \
    SSL_CERT_DIR="/etc/pki/tls/certs" \
    PYTHONOPTIMIZE=0

# Run as the non-root user
USER ${RUN_USER}