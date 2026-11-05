# Check NOFO production history readiness

This manually dispatched check determines whether production's indexed document
history is complete and matches the currently visible history for the original
[slow-history example](https://github.com/HHS/simpler-grants-pdf-builder/issues/1142).
It does not backfill, migrate, deploy, change Constance, or enable indexed reads.
It launches a separate read-only task using the production service's deployed
task-definition revision, application role and network configuration. It adds no
IAM permissions or credentials and accepts no environment, document, image,
role or command input.

## Run one check during a quiet period

1. Confirm no external migration/backfill or bulk audit import is running and
   no production deployment is running or queued. Keep
   `DOCUMENT_HISTORY_INDEX_ENABLED` **False** in production. The
   task refuses to inspect further if it reads an enabled setting.
2. After review and merge, open **Actions → Check NOFO production history
   readiness → Run workflow** in `HHS/simpler-grants-gov`.
3. Keep the workflow branch set to `main`. Runs from other branches are skipped.
4. Open **check → Check history readiness without changing production data**.
   The run summary and recognized log line report only fixed statuses and
   nonnegative integer counts/timings. Do not publish task configuration, raw
   CloudWatch logs, exception text, document content or audit identifiers.
5. Interpret the result below. Leave the switch off. A successful check is not
   permission to enable the reader or run a backfill.

The workflow shares the existing `cd-nofos-prod` deployment concurrency group,
verifies stable rollout and current worker revisions, and rejects another active
or stopping check task. Coordinate separate AWS work outside this workflow too;
it cannot identify every manual database command. No source code is installed
into the service and no application release is required to run the check.
GitHub concurrency retains only one pending run per group: a new check can
replace a pending deployment, or vice versa. Do not launch this check while
production deployments are running or queued; schedule one quiet-period run.

## What it checks

PostgreSQL enforces one repeatable-read, read-only transaction. Each statement
has a 15-second timeout and a two-second lock timeout. The task:

1. Reads the current Constance switch.
2. Counts relevant original audit records and records without an index row.
   Counts include invisible history events, preserving the current global gate.
3. If any row is missing, reports `index_incomplete` and **skips the expensive
   legacy-history comparison**. Counts alone cannot distinguish a never-run
   backfill from unresolved legacy ownership; do not infer that another backfill
   will repair it automatically.
4. Only for a complete nonempty global index, compares full visible event-ID
   membership for the fixed production NOFO
   `e5664268-36af-43ca-bf49-61983533041b`. Identifiers remain inside the task.
   Both legacy-only and indexed-only differences block readiness and need review.
   Differences may include recovered deleted history, not necessarily omissions.

| Status | Meaning / next step |
| --- | --- |
| `ready` | Complete index and matching target; review before any trial. |
| `index_incomplete` | Missing rows; assess preparation or legacy gaps. |
| `coverage_mismatch` | Different visible events; investigate. |
| `target_missing` | The fixed target was not found. |
| `target_empty` | Target history was empty; not representative. |
| `empty_audit` | No relevant audit records; not representative. |
| `reader_enabled` | Switch already on; establish intended state separately. |
| `query_timeout` | Readiness not established; investigate before retrying. |
| `check_failed` | Readiness not established; inspect the task privately. |

Only `ready` with successful container exit makes the workflow green. A red run
with validated `index_incomplete` is an informative readiness result, not proof
that the workflow malfunctioned. Partial counters after a timeout or error do
not establish readiness. A failed database transaction rolls back its inspection.

## Bounds, load and cleanup

Read-only queries still consume production database resources. The global counts
may scan audit/index tables. When the index is complete, the one legacy read can
load large serialized snapshots into the separate task and is bounded by the
existing container memory limit; Python processing is bounded by the task wait,
not the SQL statement timeout. Run once off-peak, monitor normal service health
through existing observability, and stop if user requests are affected.

The helper waits up to five minutes for the task, plus bounded AWS calls and log
delivery retries. Workflow timeout is 20 minutes, including Terraform/AWS setup.
On timeout/cancellation it attempts to stop its own task and prints its identifier.
Cleanup can fail if the runner is terminated or AWS access fails. Confirm
`STOPPED` before retrying or deploying; concurrency ends when the workflow ends.
It never stops service workers. Logs unavailable to the existing role cause a
failed check rather than unverified success; no IAM expansion is introduced.

Dev evidence does not establish production readiness. This check does not measure
full HTTP/browser performance, verify all document permissions, or settle unknown
legacy ownership. Keep the performance issue open until the original first page,
Load More, comparison links, coverage and access behavior have been verified via
a separately approved production trial.
