# Prepare NOFO document history in dev

This manual GitHub Actions workflow prepares the online NOFO Builder **dev**
database for indexed history. You do not need to run dev locally or configure
AWS credentials on your computer. It uses the same GitHub-to-AWS authentication
as deployments, targeting `nofos` in `infra-dev`.

The workflow does not deploy, run migrations, change Constance, or target
production. It runs the backfill and then the completeness check in one task
using the task-definition revision currently deployed to dev. It accepts no
environment, image, role, or arbitrary-command input.

## Before running

1. Complete the dev application deployment containing the indexed history reader,
   backfill command and Constance switch. The workflow verifies that the service
   rollout is complete and all running workers use its task definition.
2. Leave `DOCUMENT_HISTORY_INDEX_ENABLED` **False** in dev's
   **Django admin → Constance → Config**. The preparation task checks this before
   writing the index. Leave it disabled throughout preparation.
3. Confirm no separate backfill or bulk audit import is running. The workflow
   rejects its own active/stopping preparation tasks and shares the dev deploy
   concurrency group. It cannot identify unrelated manual database commands or
   deployments outside that concurrency group.

## Run it from GitHub

1. Open **Actions** in `HHS/simpler-grants-gov`.
2. Choose **Prepare NOFO document history - dev**.
3. Select **Run workflow**, keep **Use workflow from** set to `main`, and confirm
   **Run workflow**. The workflow is available after this PR merges to `main`;
   runs from other branches are skipped.
4. Open the run and expand **Backfill and check dev history → Prepare document
   history**. It executes:

   ```sh
   poetry run python manage.py backfill_document_audit_index --chunk-size 100
   poetry run python manage.py backfill_document_audit_index --check
   ```

5. Wait for a successful run. The output must include:

   ```text
   Document audit index complete: 0 events missing.
   ```

   Actions shows the resolved/unresolved counts and a task identifier. Success
   requires exit code zero, zero unresolved ownership, and the completeness
   message from CloudWatch.
   The run summary confirms that Constance is unchanged.
6. Only after success, open dev's Constance admin, check
   `DOCUMENT_HISTORY_INDEX_ENABLED`, and save. No worker restart is needed.
7. Test **See all updates**, **Load More Events**, and a comparison link on a dev
   NOFO with a substantial edit history. Record first-page and Load More timings,
   aiming for approximately two seconds or less. Report results in
   [the application issue](https://github.com/HHS/simpler-grants-pdf-builder/issues/1142).
   A successful backfill does not establish the performance target.

## If the run fails or needs to stop

For unresolved ownership, use **Actions → Diagnose NOFO document history - dev →
Run workflow → main** before changing application code or rerunning preparation.
This separate workflow runs a fixed diagnostic in a PostgreSQL read-only
transaction. It reports aggregate counts by model, snapshot structure, known
parent-field availability, and retained/live ownership. It logs no document
content, event identifiers, object identifiers, user details or arbitrary field
names. Its success means diagnosis completed, not that history is ready to
enable. It uses the same rollout, task-revision, concurrency and cleanup checks.

Keep Constance **False**. A failed backfill prevents the completeness command from
running; an incomplete check, failed container, or unavailable completeness logs
keeps the workflow failed. Inspect the task identified in Actions before retrying.
Only recognized count messages are copied from CloudWatch into Actions, avoiding
document content or arbitrary application logs. Privately inspect task logs for
configuration, permission or application errors. CloudWatch read permission must
already be available to the deployment role; no IAM permissions are added here.

The task wait is limited to 30 minutes, with status printed every 15 seconds.
On timeout or cancellation the helper requests a task stop where possible. A
forcefully terminated runner or AWS permission/network failure can prevent cleanup.
**Cancellation alone does not prove the database task stopped.** Confirm its
status is `STOPPED` before retrying or starting a deployment. Workflow concurrency
does not extend beyond the lifetime of the workflow run. Coordinate any direct
AWS work separately.

The backfill can be rerun, but scans historical events again. Do not repeatedly
retry a timeout, unresolved ownership or high database load. Investigate first;
never delete original audit records, fake migrations, or enable the reader to
work around a failed check. On a later history-reader problem, uncheck the
Constance switch and save to restore legacy reads.

This workflow is dev-only. Production preparation needs a separately reviewed
operational path after dev duration, load and correctness have been validated.
