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
    mkdir -p "/home/${RUN_USER}" /grants_shared /grants_shared/tmp /var/spool/mail /tmp /var/tmp /usr/tmp /opt/venv && \
    chown -R "${RUN_UID}:${RUN_UID}" "/home/${RUN_USER}" /grants_shared /grants_shared/tmp /opt/venv && \
    chmod 700 /grants_shared/tmp && \
    chmod 1777 /tmp /var/tmp /usr/tmp /opt/venv

WORKDIR /grants_shared

COPY pyproject.toml uv.lock ./

RUN rm -rf /grants_shared/.venv || true

COPY . /grants_shared

# Prefer external venv to avoid mutating release venv
ENV VIRTUAL_ENV=/opt/venv
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
# Place entry points in the environment at the front of the path
ENV PATH="/opt/venv/bin:$PATH"

# We are fine with dev dependencies in this
# image as we don't need a release image
ENV UV_NO_DEV=0
# Compile python to *.pyc files for performance
ENV UV_COMPILE_BYTECODE=1
ENV UV_CACHE_DIR="/tmp/.cache/uv"
ENV UV_NO_SYNC=1

RUN set -e && PY_MM=$(cat /tmp/py_version.txt) && \
    uv venv /opt/venv && \
    uv sync --locked --all-groups && \
    uv build && \
    (rm -rf /root/.cache "/home/${RUN_USER}/.cache" /var/tmp/* /grants_shared/src || true)
