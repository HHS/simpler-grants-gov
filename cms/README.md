# Simpler.Grants.gov CMS

## Introduction

- A headless ("decoupled") [Drupal 11](https://www.drupal.org/) site that will manage editorial content for the Next.js frontend, per the [CMS ADR](../documentation/wiki/product/decisions/adr/2026-01-content-management-system.md).
- The frontend will read content through Drupal core's [JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module). Drupal does not render public pages.
- Runs on PHP 8.5, with PostgreSQL 17 for the database.

## Directory structure

```

├── bin               # Scripts run by deploy tooling (db-migrate)
├── config/sync       # Exported Drupal configuration: content types, fields, settings
├── recipes           # Drupal recipes; simpler_seed_content adds sample content locally
└── web               # Drupal web root. Only these paths are committed:
    ├── modules/custom        # Our modules (e.g. simpler_health)
    └── sites/default/settings.php
```

Everything else under `web/`, plus `vendor/`, is installed by Composer.

## 💻 Local development

The CMS runs directly on your machine with PHP's built-in web server and a local PostgreSQL. Run every command below from this directory.

### 1. Install PHP, Composer and PostgreSQL

On macOS with Homebrew:

```bash
brew install php composer postgresql@17
brew services start postgresql@17

# postgresql@17 is keg-only, so add its tools (psql, createdb) to your PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

Homebrew's PHP includes the extensions Drupal needs (`gd`, `intl`, `opcache`, `pdo_pgsql` and `zip`). On other systems, install those along with PHP 8.5.

### 2. Create the database

```bash
psql postgres -c "CREATE ROLE drupal LOGIN PASSWORD 'secret123';"
createdb -O drupal drupal
psql -d drupal -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm;'
```

Drupal 11 requires the `pg_trgm` extension. Creating it as your own (superuser) account means the `drupal` role doesn't need superuser rights, as in deployed environments.

### 3. Install dependencies and set environment variables

```bash
composer install
```

`web/sites/default/settings.php` reads its database connection and other settings from environment variables. Create a git-ignored `.env.local` file with the local values:

```bash
cat > .env.local <<'EOF'
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=drupal
DB_USER=drupal
DB_PASSWORD=secret123

# Not a secret: only used to sign one-time login links on your machine
DRUPAL_HASH_SALT=local-development-hash-salt-not-for-deployed-environments

# Comma-separated regular expressions of host names Drupal will respond to
DRUPAL_TRUSTED_HOST_PATTERNS='^localhost$,^127\.0\.0\.1$'

# Base URL drush uses when it prints links, e.g. `drush user:login`
DRUSH_OPTIONS_URI=http://127.0.0.1:8888
EOF
```

Nothing loads `.env.local` automatically. Load it into each new terminal before running drush or the server:

```bash
set -a; source .env.local; set +a
```

### 4. Install Drupal and add seed content

```bash
php -d memory_limit=256M vendor/drush/drush/drush.php site:install --existing-config --yes
vendor/bin/dr recipe:apply "$PWD/recipes/simpler_seed_content"
```

- `site:install --existing-config` builds the site from `config/sync`. It runs `drush.php` directly because `vendor/bin/drush` is a shell script and can't take PHP's `-d` option. The higher memory limit prevents the install from running out of memory, since Homebrew's PHP defaults to 128M.
- The recipe path must be absolute because `dr` changes into `web/` before it runs.

### 5. Start the server

```bash
php -d memory_limit=256M -S 127.0.0.1:8888 -t web "$PWD/web/.ht.router.php"
```

The CMS runs at http://127.0.0.1:8888, and http://127.0.0.1:8888/health returns `{"status":"ok"}`. The router path must be absolute because Drupal changes the server's working directory after some requests, which breaks a relative path.

In another terminal, load `.env.local` and print a one-time admin login link:

```bash
vendor/bin/drush user:login
```

### Common commands

Load `.env.local` first for the drush commands.

| Command | What it does |
| --- | --- |
| `vendor/bin/drush status` | Show Drupal, PHP and database status |
| `vendor/bin/drush cache:rebuild` | Rebuild all caches |
| `vendor/bin/drush user:login` | Print a one-time admin login link |
| `vendor/bin/drush config:export --yes` | Write configuration changes to `config/sync` |
| `vendor/bin/drush config:import --yes` | Apply `config/sync` to the local site |
| `vendor/bin/drush config:status` | List differences between the site and `config/sync` |
| `php -d memory_limit=256M vendor/drush/drush/drush.php site:install --existing-config --yes` | Reinstall from `config/sync`. Replaces the local database. |
| `vendor/bin/phpcs` / `vendor/bin/phpcbf` | Check or automatically fix Drupal coding standards |
| `vendor/bin/phpstan analyse --memory-limit=1G` | Run static analysis |
| `vendor/bin/phpunit` | Run unit tests |
| `composer audit` | Check dependencies for known security advisories |

### Troubleshooting

| Error | Cause and fix |
| --- | --- |
| `RecipeCommand::__construct(): Argument #3 ($configStorage) must be of type ... StorageCacheInterface, ... InstallStorage given` | Drupal isn't installed in the database it connected to. Load `.env.local` and run the `site:install` step. |
| `Failed opening required 'web/.ht.router.php'` | The server was started with a relative router path. Restart it with the command in step 5. |
| `The supplied path recipes/simpler_seed_content is not a directory` | Pass the recipe as an absolute path, as in step 4. |
