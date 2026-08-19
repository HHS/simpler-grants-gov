# metabase-backup-v2/

This directory is intentionally empty until populated by the `make mb-backup-v2`
command. The command will fetch and persist dashboards, queries, and
visual metadata from a target Metabase instance into the format described in
[`../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md).

## Create a Backup Dataset from a live source instance

1. Get an API key with schema-metadata access (see the format doc's
   cross-instance field id section for details)
2. Set the environment variables `MB_API_KEY` and `MB_API_URL` for the 
   source instance
3. (Optional) Set `MB_BACKUP_V2_DIR` to write somewhere other than the
   default `metabase-backup-v2`
4. From `simpler-grants-gov/analytics`, run `make mb-backup-v2`
5. Review results on command line and in `CHANGELOG.txt`

## Restore from a Backup Dataset

A backup dataset can be fed directly to the `restore` command to instantiate
a new collection of dashboards, queries, and metadata in a target instance.
See [`../metabase-restore/README.md`](../metabase-restore/README.md) for details.
