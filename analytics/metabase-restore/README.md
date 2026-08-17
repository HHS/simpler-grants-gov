# metabase-restore/

A curated set of Metabase questions and dashboards, published to a Metabase
instance by `make mb-restore`. Every run creates a new, timestamped
collection -- restoring never modifies or deletes anything already in the
target instance.

See [`../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md`](../src/analytics/integrations/metabase/BACKUP_V2_AND_RESTORE_FORMAT.md)
for the directory format itself (levels, sidecar JSON, cross-references,
dashboard schema).

## Regenerating this content

This directory's content is a curated snapshot, not something regenerated
automatically. To refresh it from a live instance:

1. Run `make mb-backup-v2` to capture everything currently in the target
   Metabase instance into `metabase-backup-v2/`.
2. Diff that output against this directory file by file
   (`diff -rq metabase-restore metabase-backup-v2`).
3. Copy over genuinely new/changed files. Skip any diff that's purely a
   per-deployment value (e.g. a default filter value baked in for one
   particular environment) rather than a real content change.
4. Verify by running `make mb-restore` against a scratch collection and
   confirming the result looks right.
