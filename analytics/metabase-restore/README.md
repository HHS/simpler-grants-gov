# metabase-restore/

This directory is intended to contain a dataset used by the `restore` command
to instantiate a full suite of dashboards, queries, and visual metadata in a
target Metabase instance.

Each run of the `restore` command creates a new, timestamped collection in 
the target instance. The command never modifies or deletes existing data 
in the target instance.

See [`BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md) for a description of the dataset format.

## Restore from a Backup Dataset to a target instance

1. Get an API key for the target instance
2. Set the environment vars `MB_API_KEY` and `MB_API_URL` to identify the
   target instance
3. From `analytics` directory, run `uv run analytics metabase restore` *
4. Review results on command line; output will include new collection URL

* The restore command reads from the `metabase-restore` directory by default.
To override the default, use a run-time switch `--restore-dir` to specify 
the directory of the dataset:
  
  `uv run analytics metabase restore --restore-dir metabase-backup-v2` 

## Create a Backup Dataset

To create a backup dataset that can be consumed by the the `restore` command,
use the `mb-backup-v2` command. Refer to [`../metabase-backup-v2/README.md`](../metabase-backup-v2/README.md) 
for details.
