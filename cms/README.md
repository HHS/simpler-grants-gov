# Simpler.Grants.gov CMS

## Introduction

- A headless ("decoupled") [Drupal 11](https://www.drupal.org/) site that will manage editorial content for the Next.js frontend, per the [CMS ADR](../documentation/wiki/product/decisions/adr/2026-01-content-management-system.md).
- The frontend will read content through Drupal core's [JSON:API](https://www.drupal.org/docs/core-modules-and-themes/core-modules/jsonapi-module). Drupal does not render public pages.
- Runs on PHP 8.5 and Apache, with PostgreSQL for the database.

## Directory structure

```

├── bin               # Scripts run by deploy tooling (db-migrate)
├── config/sync       # Exported Drupal configuration: content types, fields, settings
├── docker            # Apache, PHP and local Postgres configuration for the image
├── recipes           # Drupal recipes; simpler_seed_content adds sample content locally
└── web               # Drupal web root. Only these paths are committed:
    ├── modules/custom        # Our modules (e.g. simpler_health)
    └── sites/default/settings.php
```

Everything else under `web/`, plus `vendor/`, is installed by Composer.

## 💻 Local development

Requires Docker. From this directory:

```bash
make init     # Build, start, install Drupal from config/sync and add seed content
make login    # Print a one-time admin login link
```

The CMS runs at http://localhost:8090 and its database is on port 5433.

| Command                                     | What it does                                                    |
| ------------------------------------------- | --------------------------------------------------------------- |
| `make start` / `make stop`                  | Start or stop the containers                                    |
| `make drush args="status"`                  | Run any drush command                                           |
| `make composer args="require drupal/token"` | Run any Composer command                                        |
| `make config-export`                        | Write configuration changes to `config/sync`                    |
| `make site-install`                         | Reinstall from `config/sync`. Replaces the local database.      |
| `make check`                                | Lint, static analysis, unit tests and dependency audit          |
| `make release-smoke-test`                   | Run the release image with ECS restrictions and check `/health` |

See [CMS development](../documentation/cms/development.md) for the configuration workflow, seed content and the release image.
