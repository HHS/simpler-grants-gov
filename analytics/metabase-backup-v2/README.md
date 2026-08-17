This directory is intentionally empty until a v2 backup has been run.

Run `make mb-backup-v2` to populate it with a fresh backup of the Metabase
instance's questions *and* dashboards, in the format described in
[`../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md).

This is a separate, more capable sibling of `analytics/src/analytics/integrations/metabase/sql/`
(the original backup, question SQL only) -- see that module's own README
for how the two differ.

A fresh `metabase-backup-v2/` snapshot can also be fed directly to
`make mb-restore` (via `MB_RESTORE_DIR=metabase-backup-v2`) to publish
everything it contains into a new Metabase collection.
