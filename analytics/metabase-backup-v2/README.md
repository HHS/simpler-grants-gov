# metabase-backup-v2/

This directory is intentionally empty until populated by the `mb-backup-v2`
command. The command will fetch and persist dashboards, queries, and
visual metadata from a source Metabase instance into the format described in
[`BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md).

## Create a Backup Dataset from a live source instance

1. Get an API key with schema-metadata access (for details, refer to the
   "cross-instance field id" section in [`BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md).
2. Set the environment vars `MB_API_KEY` and `MB_API_URL` to identify the 
   source instance
3. (Optional) Set the environment var `MB_BACKUP_V2_DIR` to write the backup 
   dataset to a directory other than the default `metabase-backup-v2`
4. From `simpler-grants-gov/analytics`, run `make mb-backup-v2`
5. Review results on command line and in `CHANGELOG.txt`

## Restore from a Backup Dataset

A backup dataset can be fed directly to the `restore` command to instantiate
a new collection of dashboards, queries, and metadata in a target instance.
See [`../metabase-restore/README.md`](../metabase-restore/README.md) for details.
