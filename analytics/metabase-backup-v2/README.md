# metabase-backup-v2/

A full backup of the production Metabase instance's questions *and*
dashboards, in the format described in
[`../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md).

This is a separate, more capable sibling of
`analytics/src/analytics/integrations/metabase/sql/` (the original backup,
question SQL only) -- see that module's own README for how the two differ,
and for the disaster-recovery purpose both directories serve.

This directory can be fed directly to `make mb-restore` (via
`MB_RESTORE_DIR=metabase-backup-v2`) to publish everything it contains into
a new, timestamped Metabase collection.

## Refreshing this backup

1. Get an API key with schema-metadata access (see the format doc's
   cross-instance field id section for why) and set `MB_API_URL`/`MB_API_KEY`
   for the target instance.
2. From `simpler-grants-gov/analytics`, run `make mb-backup-v2` and confirm
   it completes without errors -- the `CHANGELOG.txt` in this directory gets
   a new entry with the run's stats.
3. Create a branch, add the changed `.sql`/`.json`/`CHANGELOG.txt` files, and
   open a PR.
