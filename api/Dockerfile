FROM amazonlinux:2023 AS builder

ARG PYTHON_VERSION=3.13.8
ARG PY_MM=3.13
ARG POETRY_VERSION=2.2.1
ARG PIP_VERSION=25.2


SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN set -euo pipefail; \
    dnf -q -y makecache; \
    yum install -y --allowerasing \
      gcc-11.5.0-5.amzn2023.0.5 \
      libstdc++-14.2.1-7.amzn2023.0.2 \
      make-1:4.3-5.amzn2023.0.2 \
      wget-1.21.3-1.amzn2023.0.4 \
      tar-2:1.34-1.amzn2023.0.4 \
      gzip-1.12-1.amzn2023.0.1 \
      openssl-devel-1:3.2.2-1.amzn2023.0.1 \
      zlib-devel-1.2.11-33.amzn2023.0.5 \
      libffi-devel-3.4.4-1.amzn2023.0.1 \
      sqlite-devel-3.40.0-1.amzn2023.0.6 \
      bzip2-devel-1.0.8-6.amzn2023.0.2 \
      readline-devel-8.1-2.amzn2023.0.2 \
      ncurses-devel-6.2-4.20200222.amzn2023.0.6 \
      xz-devel-5.2.5-9.amzn2023.0.2 \
      gdbm-devel-1:1.19-2.amzn2023.0.2 \
      shadow-utils-2:4.9-12.amzn2023.0.4 \
      graphviz-2.44.0-25.amzn2023.0.7 \
     curl-8.11.1-4.amzn2023.0.1 \
    && yum clean all && rm -rf /var/cache/yum

# Download and build Python with optimizations
WORKDIR /tmp
RUN wget -q https://www.python.org/ftp/python/${PYTHON_VERSION}/Python-${PYTHON_VERSION}.tgz && tar xzf Python-${PYTHON_VERSION}.tgz
WORKDIR /tmp/Python-${PYTHON_VERSION}
RUN ./configure \
        --prefix=/usr/local \
        --enable-optimizations \
        --enable-shared \
        --with-ensurepip=install \
        LDFLAGS="-Wl,-rpath=/usr/local/lib" && \
    make -j"$(nproc)" && \
    make install
WORKDIR /tmp
# Clean Python build artifacts, ensure pip version, create symlinks, and install Poetry in one layer
RUN rm -rf "Python-${PYTHON_VERSION}" "Python-${PYTHON_VERSION}.tgz" && \
    python3 -m pip install --no-cache-dir --upgrade "pip==${PIP_VERSION}" && \
    ln -sf /usr/local/bin/python3 /usr/local/bin/python && \
    ln -sf /usr/local/bin/pip3 /usr/local/bin/pip && \
    pip3 install --no-cache-dir poetry==${POETRY_VERSION}

# Provide lightweight shims for 'cat' and 'ls' so subprocess can always find them
RUN printf '%s\n' '#!/usr/bin/bash' 'exec /usr/bin/cat "$@"' > /usr/local/bin/cat && chmod +x /usr/local/bin/cat && \
    printf '%s\n' '#!/usr/bin/bash' 'exec /usr/bin/ls  "$@"' > /usr/local/bin/ls  && chmod +x /usr/local/bin/ls

# Remove pip from runtime (keep Poetry, remove vulnerable pip)
RUN rm -rf /usr/local/lib/python${PY_MM}/site-packages/pip* \
    /usr/local/lib/python${PY_MM}/site-packages/setuptools* \
    /usr/local/lib/python${PY_MM}/site-packages/_distutils_hack \
    /usr/local/bin/pip* \
    /usr/local/bin/easy_install* \
    /root/.cache

# Strip binaries to reduce size
RUN find /usr/local -type f -executable -exec strip --strip-all {} + 2>/dev/null || true && \
    find /usr/local -name "*.so*" -exec strip --strip-all {} + 2>/dev/null || true

# Collect required shared libraries for Python
RUN mkdir -p /runtime/python-libs && \
    ldd /usr/local/bin/python${PY_MM} | grep "=>" | awk '{print $3}' | grep -v "^$" | xargs -I '{}' cp '{}' /runtime/python-libs/ 2>/dev/null || true && \
    for lib in /lib64/ld-*.so.* /lib/ld-*.so.*; do [ -f "$lib" ] && cp "$lib" /runtime/python-libs/; done 2>/dev/null || true
# Also copy generic dynamic loader symlinks required by execve on common arches
RUN for link in /lib64/ld-linux-x86-64.so.2 /lib/ld-linux-aarch64.so.1; do \
      [ -e "$link" ] && cp -P "$link" /runtime/python-libs/ || true; \
    done

# Also collect libraries required by Python extension modules (e.g., zlib, bz2, lzma, ssl, sqlite3)
RUN shopt -s nullglob; for so in "/usr/local/lib/python${PY_MM}/lib-dynload/"*.so; do \
      ldd "$so" 2>/dev/null | grep "=>" | awk '{print $3}' | grep -v "^$" | xargs -I '{}' cp '{}' /runtime/python-libs/ 2>/dev/null || true; \
    done
# Explicitly include common GCC/C++ runtime libraries needed by native wheels (e.g., pydantic-core, numpy)
RUN for lib in /lib64/libgcc_s.so.1 /usr/lib64/libgcc_s.so.1 /lib64/libstdc++.so.6 /usr/lib64/libstdc++.so.6; do \
      [ -f "$lib" ] && cp "$lib" /runtime/python-libs/ || true; \
    done
# Explicitly include essential glibc runtime libraries commonly required by C extensions
RUN for lib in /lib64/libpthread.so.0 /usr/lib64/libpthread.so.0 \
               /lib64/libc.so.6 /usr/lib64/libc.so.6 \
               /lib64/libm.so.6 /usr/lib64/libm.so.6 \
               /lib64/libdl.so.2 /usr/lib64/libdl.so.2 \
               /lib64/librt.so.1 /usr/lib64/librt.so.1 \
               /lib64/libutil.so.1 /usr/lib64/libutil.so.1 \
               /lib64/libnsl.so.1 /usr/lib64/libnsl.so.1 \
               /lib64/libcrypt.so.1 /usr/lib64/libcrypt.so.1; do \
      [ -f "$lib" ] && cp "$lib" /runtime/python-libs/ || true; \
    done
# Resolver and NSS libraries required by network clients (e.g., psycopg binary)
RUN for lib in /lib64/libresolv.so.2 /usr/lib64/libresolv.so.2 \
               /lib64/libnss_dns.so.2 /usr/lib64/libnss_dns.so.2 \
               /lib64/libnss_files.so.2 /usr/lib64/libnss_files.so.2; do \
      [ -f "$lib" ] && cp "$lib" /runtime/python-libs/ || true; \
    done


# Collect only the required libraries for minimal runtime binaries
RUN mkdir -p /runtime/system-libs && \
    for binary in /usr/bin/sh /usr/bin/bash /usr/sbin/useradd /usr/bin/ls /usr/bin/cat /usr/bin/curl /usr/bin/wget; do \
        [ -f "$binary" ] && ldd "$binary" 2>/dev/null | grep "=>" | awk '{print $3}' | grep -v "^$" | xargs -I '{}' cp '{}' /runtime/system-libs/ 2>/dev/null || true; \
    done


#==============================================
# Stage 2: Minimal base FROM SCRATCH
#==============================================
FROM scratch AS base

# Ensure /bin/sh exists for RUN in this stage
COPY --from=builder /usr/bin/sh /bin/sh

# Copy Python runtime
COPY --from=builder /usr/local /usr/local

# Copy Python shared libraries (including dynamic loader)
COPY --from=builder /runtime/python-libs /lib
COPY --from=builder /runtime/python-libs /lib64

# Copy minimal required system binaries
COPY --from=builder /usr/bin/sh /usr/bin/sh
COPY --from=builder /usr/bin/bash /usr/bin/bash
COPY --from=builder /usr/sbin/useradd /usr/sbin/useradd
COPY --from=builder /usr/bin/ls /usr/bin/ls
COPY --from=builder /usr/bin/cat /usr/bin/cat
COPY --from=builder /usr/bin/curl /usr/bin/curl
COPY --from=builder /usr/bin/wget /usr/bin/wget


# Copy only the specific system libraries required by the selected binaries
COPY --from=builder /runtime/system-libs /usr/lib64

# Copy essential system files
COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/group /etc/group
# Include shadow since we create users in this stage
COPY --from=builder /etc/shadow /etc/shadow
# Copy CA certificates bundle for TLS verification
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /etc/pki/ca-trust /etc/pki/ca-trust

# Create necessary directories
COPY --from=builder /tmp /tmp

# Use bash as the shell for RUN in this stage to avoid /bin/sh resolution issues
SHELL ["/usr/bin/bash", "-lc"]

# Set environment for Python
ENV PATH="/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    LD_LIBRARY_PATH="/lib:/lib64:/usr/lib64:/usr/local/lib" \
    SSL_CERT_FILE="/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem" \
    SSL_CERT_DIR="/etc/ssl/certs:/etc/pki/ca-trust/extracted/pem" \
    TMPDIR="/tmp"

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

# Add Graphviz tools only for dev image
COPY --from=builder /usr/bin/dot /usr/bin/dot
COPY --from=builder /usr/bin/neato /usr/bin/neato
COPY --from=builder /usr/bin/fdp /usr/bin/fdp
COPY --from=builder /usr/bin/sfdp /usr/bin/sfdp
COPY --from=builder /usr/bin/twopi /usr/bin/twopi
COPY --from=builder /usr/bin/circo /usr/bin/circo
# Graphviz libraries and plugins: copy recursively for simplicity in dev
COPY --from=builder /usr/lib64/graphviz /usr/lib64/graphviz
# Also copy the full /usr/lib64 so all transitive deps (pango/cairo/etc.) are present in dev
COPY --from=builder /usr/lib64 /usr/lib64
# Optional: copy Graphviz shared data (layouts, config), harmless if absent
COPY --from=builder /usr/share/graphviz /usr/share/graphviz

# Pango / GDK-Pixbuf / Fontconfig runtime data & helpers required by Graphviz plugins (optional in dev)
# These paths may not exist depending on the repository snapshot; the dev image already copies /usr/lib64 and /lib64
# which should include most transitive dependencies. We avoid hard COPYs that can fail the build.
COPY --from=builder /etc/fonts /etc/fonts
COPY --from=builder /usr/share/fonts /usr/share/fonts

# Also copy core system lib directories and dynamic linker configs to satisfy transitive deps
# (kept only in dev to avoid bloating release)
COPY --from=builder /lib64 /lib64
COPY --from=builder /lib /lib
COPY --from=builder /etc/ld.so.cache /etc/ld.so.cache
COPY --from=builder /etc/ld.so.conf /etc/ld.so.conf
COPY --from=builder /etc/ld.so.conf.d /etc/ld.so.conf.d

# Generate caches for fontconfig, gdk-pixbuf loaders, and pango modules, then init Graphviz plugins (all optional in dev)
RUN "/usr/local/bin/python${PY_MM}" -c "import os; os.makedirs('/etc/pango', exist_ok=True); os.makedirs('/usr/lib64/gdk-pixbuf-2.0/2.10.0', exist_ok=True)" && \
    ([ -x /usr/bin/fc-cache ] && fc-cache -f || true) && \
    ([ -x /usr/bin/gdk-pixbuf-query-loaders ] && (gdk-pixbuf-query-loaders --update-cache || gdk-pixbuf-query-loaders > /usr/lib64/gdk-pixbuf-2.0/2.10.0/loaders.cache) || true) && \
    ([ -x /usr/bin/pango-querymodules ] && pango-querymodules > /etc/pango/pango.modules || true) && \
    (dot -c || true)

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

# Explicitly create a new virtualenv
RUN poetry config virtualenvs.in-project false && poetry env use python

# Install all dependencies including dev dependencies
RUN poetry install --no-root --with dev

COPY . /api

CMD ["poetry", "run", "flask", "--app", "src.app", "run", "--host", "0.0.0.0", "--port", "8080", "--reload"]

#==============================================
# Stage 5: Minimal release runtime
#==============================================
FROM scratch AS release
ARG RUN_USER
ARG RUN_UID

# Copy dynamic loader and runtime libs collected in builder
COPY --from=builder /runtime/python-libs /lib
COPY --from=builder /runtime/python-libs /lib64
# Also copy minimal system libs needed by coreutils we include below
COPY --from=builder /runtime/system-libs /usr/lib64

# Minimal etc files with created user
COPY --from=base /etc/passwd /etc/passwd
COPY --from=base /etc/group /etc/group
# Copy CA certs for TLS verification
COPY --from=base /etc/ssl/certs /etc/ssl/certs
COPY --from=base /etc/pki/ca-trust /etc/pki/ca-trust

COPY --from=base /usr/local /usr/local

COPY --from=base /tmp /tmp
COPY --from=base /var/tmp /var/tmp
COPY --from=base /usr/tmp /usr/tmp

# Include minimal coreutils used by tests and diagnostics
COPY --from=builder /usr/bin/ls /usr/bin/ls
COPY --from=builder /usr/bin/cat /usr/bin/cat
COPY --from=builder /usr/bin/sh /bin/sh
COPY --from=builder /usr/bin/curl /usr/bin/curl
COPY --from=builder /usr/bin/wget /usr/bin/wget

# Working directory and app
WORKDIR /api
# Copy entire application directory from base to ensure all runtime files are present
COPY --from=base /api /api
# Ensure tmp dir ownership for runtime user remains correct
COPY --from=base --chown=${RUN_USER}:${RUN_USER} /api/tmp /api/tmp


# Runtime env
ENV PATH="/api/.venv/bin:/usr/local/bin:/usr/bin:/usr/sbin:/bin" \
    HOST=0.0.0.0 \
    TMPDIR="/dev/shm" \
    SSL_CERT_FILE="/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem" \
    SSL_CERT_DIR="/etc/ssl/certs:/etc/pki/ca-trust/extracted/pem"

# Run as the non-root user created in release
USER ${RUN_USER}

CMD ["gunicorn", "--worker-tmp-dir=/dev/shm", "src.app:create_app()"]
