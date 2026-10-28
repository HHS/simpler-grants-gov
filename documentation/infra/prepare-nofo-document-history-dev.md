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

For unresolved ownership, use **Actions → Inspect NOFO document history - dev →
Run workflow → main**, choosing **diagnose**, before rerunning preparation.
This separate workflow runs a fixed diagnostic in a PostgreSQL read-only
transaction. It reports aggregate counts by model, snapshot structure, known
parent-field availability, and retained/live ownership. It logs no document
content, event identifiers, object identifiers, user details or arbitrary field
names. Its success means diagnosis completed, not that history is ready to
enable. It uses the same rollout, task-revision, concurrency and cleanup checks.

### Gather preliminary dev performance and coverage evidence

Choose **verify** in that same inspection workflow to measure the user-supplied
CAP-STIs dev NOFO, `d9bfd050-4d01-482b-847d-1e01b478838a`. No extra workflow is
needed. The original production example from Builder #1142 is not present in dev:
[the first verification run](https://github.com/HHS/simpler-grants-gov/actions/runs/40556189493)
reported `target_missing`. This replacement target is fixed in reviewed source;
no arbitrary document, command, environment or production input is accepted. A
missing selected document still fails explicitly instead of substituting another.

On October 27, the current legacy history UI showed 13 visible events for CAP-STIs,
11 for BEN-TEST-3 (`03fa1e14-71cb-47e1-a92c-1cc79dc235bd`), and 9 for Dental
Preventive and Clinical Support Program (`918ec820-82c3-47f0-b5a7-6899ee4f0949`).
CAP-STIs includes a deleted-subsection event and comparison links. These are UI
observations, not indexed event counts or timing measurements. None currently
offers Load More. CAP-STIs provides preliminary coverage evidence, not a large
history/pagination stress test or proof that the original production issue is
fixed. An empty second page does not validate Load More performance. A longer
history and the original production example remain acceptance work for #1142.

The verification executes explicit indexed and legacy reader functions in one
PostgreSQL repeatable-read, read-only transaction with a 30-second per-statement
timeout. It never changes Constance or runs a backfill. The deployed task's
existing memory limits and the helper's 30-minute task deadline still apply.
The legacy comparison deliberately incurs its existing full-history read cost
once in a separate dev task; avoid running during other dev activity.

Only fixed counters and integer timings leave the task:

- Indexed first-page and second-page selection/formatting times and row counts.
- Duplicate visible events across those two pages.
- Full legacy selection time and full visible event totals for both readers.
- Events shown only by the legacy reader or only by the index, plus a deleted
  object count for legacy-only events.
- Whether the PostgreSQL plan was inspected and names `document_audit_page_idx`.

These are task-side measurements, not HTTP/browser timings or proof of access
controls. The first/second-page timers include batched labels and comparison-link
eligibility; they exclude template rendering, network transfer and browser work.
Legacy timing is selection only. A named index not appearing in the plan needs
review; it is not automatically an error for a small data set.

A green inspection means measurements completed. It does not authorize enabling
history. Any legacy-only events need explanation before cutover. Indexed-only
events can include recovered deleted-section history, but still need review.
Zero events in both readers is not a representative performance test. Ordering
differs intentionally: the index uses exact timestamps/event IDs while legacy
history groups by minute/action. Compare full coverage, not identical page order.

After reviewing coverage, validate actual dev browser first-page and Load More
timings against the approximately two-second goal, deleted-item presentation,
comparison links and access restrictions. Keep the switch off unless a separately
reviewed rollout change provides an approved way to perform that UI verification.
The global zero-missing completeness rule remains in force in this PR; any
replacement needs explicit legacy accounting and coverage disclosures. The
performance issue must remain open until user-facing timings are verified.

### Workflow and tracker disposition

Keep **Prepare NOFO document history - dev** for controlled maintenance/backfill
after an approved repair or bulk import. Do not blindly rerun it to chase a lower
unresolved count. Keep the single **Inspect NOFO document history - dev** workflow
for verification and diagnosis; the old diagnostic filename remains for links.
Both are manual, so retaining them creates no recurring scheduled work. Preserve
completed run evidence. No history workflow is obsolete yet, and unrelated
deployment, security and Readability Calculator workflows are outside this cleanup.

Builder #1142 owns the user-facing performance outcome. SGG #12961 owns the
operating workflow delivery and verification. Track unresolved legacy ownership
in [Builder #1230](https://github.com/HHS/simpler-grants-pdf-builder/issues/1230),
without claiming that current counts prove those entries can be
ignored or that they all belong to deleted documents. Merged PRs #1187/#1220
(Builder) and #12971 (SGG) are delivered changes, not additional open blockers.

### Failure handling

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
