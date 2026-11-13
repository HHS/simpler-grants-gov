# Drupal CMS for Simpler.Grants.gov
#
# Stages:
#   base    - PHP + Apache with the extensions Drupal needs
#   dev     - base + Composer and development PHP settings; code is bind-mounted
#   build   - installs production Composer dependencies and copies in our code
#   release - base + the built application. Runs as a non-root user on port 8000
#             and only writes to /tmp, so it works with a read-only root filesystem.
# =============================================================================
FROM php:8.5-apache-trixie AS base

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

ARG RUN_UID
ARG RUN_USER

# Install the PHP extensions Drupal needs, then remove build-only packages.
# Based on the official Drupal image: https://github.com/docker-library/drupal
RUN set -eux; \
  savedAptMark="$(apt-mark showmanual)"; \
  apt-get update; \
  # Pick up Debian security fixes released since the PHP base image was built
  apt-get upgrade -y; \
  apt-get install -y --no-install-recommends \
    $PHPIZE_DEPS \
    libfreetype6-dev \
    libicu-dev \
    libjpeg-dev \
    libpng-dev \
    libpq-dev \
    libwebp-dev \
    libzip-dev; \
  docker-php-ext-configure gd --with-freetype --with-jpeg=/usr --with-webp; \
  docker-php-ext-install -j "$(nproc)" gd intl pdo_pgsql zip; \
  pecl install apcu-5.1.28; \
  docker-php-ext-enable apcu; \
  apt-mark auto '.*' > /dev/null; \
  apt-mark manual $savedAptMark; \
  # The PHP base image keeps a compiler toolchain for building extensions.
  # Ours are built, so let the purge below remove it from the runtime image.
  apt-mark auto autoconf dpkg-dev file g++ gcc libc6-dev make pkg-config re2c; \
  ldd "$(php -r 'echo ini_get("extension_dir");')"/*.so \
    | awk '/=>/ { so = $(NF-1); if (index(so, "/usr/local/") == 1) { next }; gsub("^/(usr/)?", "", so); printf "*%s\n", so }' \
    | sort -u | xargs -r dpkg-query --search | cut -d: -f1 | sort -u | xargs -rt apt-mark manual; \
  apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false; \
  # wget is used by the ECS container health check
  apt-get install -y --no-install-recommends wget; \
  rm -rf /var/lib/apt/lists/* /tmp/pear

# Create the user the container runs as
RUN : "${RUN_USER:?RUN_USER and RUN_UID need to be set and non-empty.}" && : "${RUN_UID:?RUN_USER and RUN_UID need to be set and non-empty.}" && \
    if [ "${RUN_USER}" != "root" ]; then \
      grep -Eq "^${RUN_USER}:" /etc/group || groupadd -g "${RUN_UID}" "${RUN_USER}"; \
      grep -Eq "^${RUN_USER}:" /etc/passwd || useradd -l -M -s /bin/bash -u "${RUN_UID}" -g "${RUN_USER}" "${RUN_USER}"; \
    fi && \
    mkdir -p /app && \
    chown "${RUN_UID}:${RUN_UID}" /app

# Serve Drupal from /app/web on port 8000. Apache's run, lock and pid files live
# under /tmp so the container can run with a read-only root filesystem. Logs
# already go to stdout/stderr in the PHP image.
ENV APACHE_RUN_USER=${RUN_USER} \
    APACHE_RUN_GROUP=${RUN_USER} \
    APACHE_RUN_DIR=/tmp/apache2/run \
    APACHE_LOCK_DIR=/tmp/apache2/lock \
    APACHE_PID_FILE=/tmp/apache2/apache2.pid
COPY docker/apache/ports.conf /etc/apache2/ports.conf
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod expires headers rewrite && \
    echo "ServerName localhost" > /etc/apache2/conf-available/servername.conf && \
    a2enconf servername

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"
COPY docker/php/conf.d/drupal.ini "$PHP_INI_DIR/conf.d/zz-drupal.ini"

WORKDIR /app
EXPOSE 8000

# =============================================================================
# Development stage
# =============================================================================
FROM base AS dev
ARG RUN_USER

# Composer uses unzip to extract packages with their file permissions intact.
# Drush uses the PostgreSQL client for site:install, sql:cli and sql:dump.
RUN apt-get update && \
    apt-get install -y --no-install-recommends postgresql-client unzip && \
    rm -rf /var/lib/apt/lists/*
COPY --from=composer:2.10 /usr/bin/composer /usr/local/bin/composer
RUN cp "$PHP_INI_DIR/php.ini-development" "$PHP_INI_DIR/php.ini"

ENV COMPOSER_HOME=/tmp/composer \
    PATH="/app/vendor/bin:${PATH}"

USER ${RUN_USER}

CMD ["apache2-foreground"]

# =============================================================================
# Build stage
# =============================================================================
FROM base AS build

RUN apt-get update && \
    apt-get install -y --no-install-recommends unzip && \
    rm -rf /var/lib/apt/lists/*
COPY --from=composer:2.10 /usr/bin/composer /usr/local/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

# Install dependencies first so this layer is cached until composer.* changes.
# The Drupal scaffold plugin generates web/index.php, .htaccess, etc.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-progress --optimize-autoloader

# Drupal core's tests and fixtures aren't needed at runtime. One fixture is a
# fake site whose installed.json lists Drupal 9.8.0, which vulnerability
# scanners would report as an outdated core.
RUN find web/core -type d -name tests -prune -exec rm -rf {} +

COPY config ./config
COPY web/modules/custom ./web/modules/custom
COPY web/sites/default/settings.php ./web/sites/default/settings.php

# =============================================================================
# Release stage
# =============================================================================
FROM base AS release
ARG RUN_USER

COPY docker/php/conf.d/release.ini "$PHP_INI_DIR/conf.d/zz-release.ini"

# Application files stay owned by root so the runtime user cannot modify them
COPY --from=build /app /app
COPY bin/db-migrate /usr/local/bin/db-migrate

ENV PATH="/app/vendor/bin:${PATH}"

USER ${RUN_USER}

CMD ["apache2-foreground"]
