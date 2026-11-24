# CMS development

The CMS is a headless Drupal 11 site in [`cms/`](../../cms). This page covers local setup, how configuration moves between environments, how the release image is built and how to fix common problems. For the decision to use Drupal, see the [CMS ADR](../wiki/product/decisions/adr/2026-01-content-management-system.md).

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

On deploy, `cms/bin/db-migrate` runs `drush deploy`, which applies database updates and imports `config/sync`. `make config-check` fails if the installed site differs from `config/sync`.

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

### Dependency updates

Renovate groups updates to `cms/composer.json`, `cms/Dockerfile` and `cms/docker-compose.yml` into one "CMS" pull request. It doesn't upgrade PHP or the local Postgres image. Upgrade PHP by hand, and keep Postgres at the version the AWS database runs.

No CI runs for `cms/` yet. Before approving a CMS update, check out its branch and run `make build composer-install check` and `make release-smoke-test`.

## Release image

The `release` stage of `cms/Dockerfile` is the image deployed to ECS. It:

- Runs Apache on port 8000 as a non-root user, matching the defaults in `infra/modules/service`.
- Writes only to `/tmp` (Apache run files, compiled Twig templates, temporary files), so it works with a read-only root filesystem.
- Includes `wget` for the ECS health check and `db-migrate` for the migration task.
- Takes all settings from environment variables. See `cms/.env.development` for the full list.

`make release-smoke-test` starts the release image locally with a read-only filesystem and no Linux capabilities, then checks `/health`. From the repository root, `make release-build APP_NAME=cms` builds the linux/amd64 image the same way the deploy pipeline does.

Public file storage moves to S3 when the CMS is deployed to AWS. Until then, the release image has no writable public files directory.

## Troubleshooting

**A port is already in use.** The CMS uses port 8090, its database 5433 and the release smoke test 8091. Stop whatever else is using the port. `docker ps` shows whether it's another container.

**`/health` returns 503 `{"status":"unavailable"}`.** Drupal is running but can't query its database. Check that `docker compose ps` shows `cms-db` as healthy and that the `DB_*` values in `cms/.env.development` match it.

**A request returns 400 "The provided host name is not valid for this server."** Drupal only answers host names that match `DRUPAL_TRUSTED_HOST_PATTERNS`, a comma-separated list of regular expressions in `cms/.env.development`. Add a pattern for any new host name, then run `make start` to apply it. If you run the image with `docker run --env-file`, pass this variable with `-e` instead: Docker Compose strips the single quotes around the value, but `docker run` keeps them as part of it.

**Your site's configuration differs from `config/sync`.** This shows up as `make config-check` failing, or as something a teammate committed missing from your admin UI. `make config-status` lists what differs. Export your own changes with `make config-export` and commit them. Apply a teammate's changes with `make config-import`, which overwrites any local change you haven't exported.

**`make release-smoke-test` fails.** It prints the release container's logs. "Read-only file system" errors mean code is writing outside `/tmp`, the only writable path in the release image and on ECS. Point that path at `/tmp`, as `settings.php` does for temporary files and compiled PHP.

**Nothing else works.** `make clean` deletes the local database, and `make init` installs a fresh site. You lose local content and any configuration you haven't exported.
