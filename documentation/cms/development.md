# CMS development

The CMS is a headless Drupal 11 site in [`cms/`](../../cms). This page covers local setup, how configuration moves between environments, and how the release image is built. For the decision to use Drupal, see the [CMS ADR](../wiki/product/decisions/adr/2026-01-content-management-system.md).

## Local setup

Requires Docker. From `cms/`:

```bash
make init
```

This builds the development image, installs Composer dependencies, installs Drupal from `config/sync` and applies the seed content recipe. Then:

- The CMS is at http://localhost:8090. Run `make login` for a one-time admin login link.
- `/health` returns `{"status":"ok"}` when Drupal can reach its database.
- `/jsonapi/node/page` returns the seeded sample page.
- PostgreSQL is on `localhost:5433` (user `drupal`, password `secret123`, database `drupal`).

The CMS has its own database container, separate from the API's `grants-db`, so it runs without the API stack.

`make clean` stops everything and deletes the local database. Run `make init` again to start fresh.

### Reaching the CMS from the frontend

A frontend running on your machine (`npm run dev`) reaches the CMS at `http://localhost:8090`. A frontend running in Docker uses `http://host.docker.internal:8090`.

## Configuration workflow

Drupal configuration (content types, fields, roles, module settings) lives in `cms/config/sync` and is committed. Content (pages, users) is not.

To change configuration:

1. Make the change in the local admin UI or with drush.
2. Run `make config-export` to write it to `config/sync`.
3. Commit the changed YAML files with the code that uses them.

On deploy, `cms/bin/db-migrate` runs `drush deploy`, which applies database updates and imports `config/sync`. CI fails if the installed site differs from `config/sync` (`make config-check`).

`make site-install` reinstalls from `config/sync`, which is the quickest way to confirm a fresh environment comes up correctly.

### Changing the content model

Content-model changes ship in the same pull request as the frontend code that reads them. Because editors fill in new fields only after a release, follow **expand → populate → contract**:

1. **Expand:** add the new field. The frontend treats it as optional and renders a fallback while it is empty.
2. **Populate:** editors fill it in after the release.
3. **Contract:** remove or rename a field in two releases. First stop reading it in the frontend, then remove it from the configuration.

## Seed content

`cms/recipes/simpler_seed_content` holds sample content for local development and CI, applied with `make seed`. It uses Drupal core's recipe and default content support, so no contributed module is needed. It is never applied in deployed environments.

To add seed content:

1. Create it in the local admin UI. The node ID is in its edit URL, e.g. `/node/2/edit`.
2. Export it into the recipe from `cms/`:

   ```bash
   docker compose exec cms dr content:export node 2 --dir=/app/recipes/simpler_seed_content/content
   ```

3. Commit the new YAML file. Content references user 1 (the admin account), which exists on every install.

## Checks

| Command                       | Tool                                                         |
| ----------------------------- | ------------------------------------------------------------ |
| `make lint` / `make lint-fix` | PHP_CodeSniffer with the Drupal and DrupalPractice standards |
| `make analyze`                | PHPStan with `mglaman/phpstan-drupal`                        |
| `make test`                   | PHPUnit unit tests in `web/modules/custom/*/tests/src/Unit`  |
| `make composer-audit`         | Composer security advisories                                 |

## Release image

The `release` stage of `cms/Dockerfile` is the image deployed to ECS. It:

- Runs Apache on port 8000 as a non-root user, matching the defaults in `infra/modules/service`.
- Writes only to `/tmp` (Apache run files, compiled Twig templates, temporary files), so it works with a read-only root filesystem.
- Includes `wget` for the ECS health check and `db-migrate` for the migration task.
- Takes all settings from environment variables. See `cms/.env.development` for the full list.

`make release-smoke-test` starts the release image locally with a read-only filesystem and no Linux capabilities, then checks `/health`. From the repository root, `make release-build APP_NAME=cms` builds the linux/amd64 image the same way the deploy pipeline does.

Public file storage moves to S3 when the CMS is deployed to AWS. Until then, the release image has no writable public files directory.
