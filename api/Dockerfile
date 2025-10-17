FROM ghcr.io/hhs/python-base-image:d25fed1@sha256:f5cc5da8ced732f92b47a0279213b0e3e83efed5f12b81d2ca8bc677505d5088 AS base

ARG RUN_UID
ARG RUN_USER

# Create user and directories
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
    [ "${RUN_USER}" = "root" ] || \
    ( \
      "/usr/local/bin/python${PY_MM}" -c "import os; os.makedirs('/var/spool/mail', exist_ok=True); os.makedirs('/api', exist_ok=True); os.makedirs('/api/tmp', exist_ok=True)" && \
      /usr/sbin/useradd --create-home --user-group --home "/home/${RUN_USER}" --uid "${RUN_UID}" "${RUN_USER}" && \
      "/usr/local/bin/python${PY_MM}" -c "import os,pwd,stat; uid=int('${RUN_UID}'); user='${RUN_USER}'; gid=pwd.getpwnam(user).pw_gid; [os.path.exists(p) and os.chown(p, uid, gid) for p in (f'/home/{user}','/api','/api/tmp')]; os.chmod('/api/tmp', stat.S_IRWXU)" \
    ) && \
    "/usr/local/bin/python${PY_MM}" -c "import os,stat; [ (os.makedirs(d, exist_ok=True), os.chmod(d, (stat.S_IRWXU|stat.S_IRWXG|stat.S_IRWXO|stat.S_ISVTX))) for d in ('/tmp','/var/tmp','/usr/tmp') ]"

WORKDIR /api

COPY pyproject.toml poetry.lock ./

RUN "/usr/local/bin/python${PY_MM}" -c "import shutil; shutil.rmtree('/api/.venv', ignore_errors=True)"

ENV POETRY_VIRTUALENVS_IN_PROJECT=true
ENV VIRTUALENV_ALWAYS_COPY=1

RUN poetry install --no-root --only main

COPY . /api

# Build the application wheel and install it into the venv
RUN poetry build --format wheel && poetry run pip install --no-cache-dir 'dist/simpler_grants_gov_api-0.1.0-py3-none-any.whl'
# Prune pip and build tools from the in-project venv to keep the final image clean
RUN /api/.venv/bin/python -c "import site,shutil,glob,os; sp=(site.getsitepackages()[0] if hasattr(site,'getsitepackages') else site.getusersitepackages()); patterns=['pip*','setuptools*','wheel*','_distutils_hack']; [ (shutil.rmtree(p, ignore_errors=True) if os.path.isdir(p) else (os.remove(p) if os.path.exists(p) else None)) for pat in patterns for p in glob.glob(os.path.join(sp, pat)) ]; bindir=os.path.join(os.path.dirname(os.path.dirname(sp)),'bin'); [ os.remove(p) for p in glob.glob(os.path.join(bindir,'pip*')) if os.path.exists(p) ]; [ os.remove(p) for p in glob.glob(os.path.join(bindir,'easy_install*')) if os.path.exists(p) ]"

#==============================================
# Stage 3: Dev image
#==============================================
FROM base AS dev
ARG RUN_USER

# Graphviz is already present in the base image; no extra COPYs needed for dev.
# Rely on the base image for Graphviz binaries, plugins, fonts, and runtime libs.
# (Removing redundant COPYs avoids duplicating OS libraries and reduces image size.)

# Ensure Graphviz and related image/text renderers can discover their plugins and caches
ENV GV_PLUGIN_PATH=/usr/lib64/graphviz \
    GDK_PIXBUF_MODULE_FILE=/usr/lib64/gdk-pixbuf-2.0/2.10.0/loaders.cache \
    PANGO_LIBDIR=/usr/lib64 \
    PANGO_SYSCONFDIR=/etc \
    FONTCONFIG_PATH=/etc/fonts \
    FONTCONFIG_FILE=/etc/fonts/fonts.conf \
    TMPDIR="/tmp"

USER ${RUN_USER}
WORKDIR /api

# In dev, prefer external venv to avoid mutating release venv
ENV POETRY_VIRTUALENVS_IN_PROJECT=false

COPY pyproject.toml poetry.lock ./

# Remove the base stage venv to avoid duplication in dev image (best effort)
RUN rm -rf /api/.venv || true

# Explicitly create a new virtualenv
RUN poetry config virtualenvs.in-project false && poetry env use python

# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /api

CMD ["poetry", "run", "flask", "--app", "src.app", "run", "--host", "0.0.0.0", "--port", "8080", "--reload"]

#==============================================
# Stage 5: Minimal release runtime
#==============================================
FROM base AS release
ARG RUN_USER

# Working directory and runtime environment
WORKDIR /api
ENV PATH="/api/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/dev/shm" \
    SSL_CERT_FILE="/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem" \
    SSL_CERT_DIR="/etc/ssl/certs:/etc/pki/ca-trust/extracted/pem" \
    GV_PLUGIN_PATH="/usr/lib64/graphviz" \
    GDK_PIXBUF_MODULE_FILE="/usr/lib64/gdk-pixbuf-2.0/2.10.0/loaders.cache" \
    PANGO_LIBDIR="/usr/lib64" \
    PANGO_SYSCONFDIR="/etc" \
    FONTCONFIG_PATH="/etc/fonts" \
    FONTCONFIG_FILE="/etc/fonts/fonts.conf"

# Ensure wget is available in runtime for ecs health checks
RUN microdnf -y install wget-1.21.3-1.amzn2023.0.4 && microdnf clean all

# Initialize Graphviz plugin cache and related caches if tools are available
RUN ([ -x /usr/bin/fc-cache ] && fc-cache -f || true) && \
    ([ -x /usr/bin/gdk-pixbuf-query-loaders ] && (gdk-pixbuf-query-loaders --update-cache || gdk-pixbuf-query-loaders > /usr/lib64/gdk-pixbuf-2.0/2.10.0/loaders.cache) || true) && \
    ([ -x /usr/bin/pango-querymodules ] && pango-querymodules > /etc/pango/pango.modules || true) && \
    (dot -c || true)

# Run as the non-root user created in base
USER ${RUN_USER}

CMD ["gunicorn", "--worker-tmp-dir=/dev/shm", "src.app:create_app()"]
