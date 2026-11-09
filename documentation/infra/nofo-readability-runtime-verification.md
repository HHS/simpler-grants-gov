# Readability Calculator runtime verification in dev

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568) and Builder
[#970](https://github.com/HHS/simpler-grants-pdf-builder/issues/970)/
[#971](https://github.com/HHS/simpler-grants-pdf-builder/issues/971).

This manual workflow fills selected runtime evidence gaps after the completed
dev WAF checks. Merging adds the tool; it does not dispatch it or deploy Builder.

## How to run

After review and merge, select **Verify Readability Calculator runtime - dev**
in GitHub Actions and run it from `main`. It takes no environment, command,
image, recipient, fixture or feature-flag inputs. Keep public uploads disabled.
Normal deployment concurrency prevents overlap with NOFO infra-dev deployment.
The deployed dev image must include the request workspace from
[Builder #1316](https://github.com/HHS/simpler-grants-pdf-builder/pull/1316).
An older image fails the `checker_workspace_available` check.
Do not overlap this run with an authenticated calculator analysis: the probe
briefly uses the application's existing analysis lock and can return busy if
another analysis holds it. Stop and investigate a failed run before retrying.

The workflow uses the existing dev credential and separate-task mechanism used
by document-history inspection. It verifies the fixed account/region/service,
requires a stable service, then launches one Fargate task using the service's
current task definition and network configuration. It does not change the
service, image, roles or security groups. The task has the application's existing
permissions; this is not a new sandbox. Effective launch/log permissions still
need verification through the first approved run.

The reviewed Python payload and hash-checked synthetic fixtures travel only in
the fixed command override (comments/formatting removed with Python's AST, then
compressed to fit ECS's 8 KiB override limit).
Nothing is downloaded by the container, and no arbitrary command is accepted.
The probe uses the deployed Builder image without modifying it.

## What it checks

| Check | Method | Limit of the evidence |
| --- | --- | --- |
| Upload switch | Read effective Constance value before/after; stop before analysis if enabled | Never changes the switch; concurrent administrator changes must still be avoided |
| Ordinary PDF analysis and errors | One small supported PDF, invalid bytes, and an encrypted version of the same fictional PDF, sequentially through the deployed `analyze_uploaded_pdf` handler | No HTTP form, middleware, usage-record or browser validation; Word is not covered |
| Temporary files | Use Builder's disk upload handler and analyzer in the same request workspace. Check that the upload file and analyzer directory are gone before fallback cleanup, then check that the workspace itself is gone | Only files created by this probe; no existing file scan; no assertion about HTTP receive buffering or stale files from normal service workers |
| Effective temporary storage | Ask Linux for the filesystem type of the synthetic disk upload and analyzer directory inside the checker workspace before cleanup | Reports memory-backed, container overlay, network, other, or unavailable. An overlay result describes the filesystem visible inside the task. It does not by itself establish retention after worker or task termination. |
| Timeout cleanup | Replace the child command within the probe process with a harmless two-second sleeper and a 0.1-second deadline; use real subprocess timeout/kill/wait and the application cleanup path | Instrumented timeout, not a pathological PDF or proof of the configured 15-second wall-clock deadline |
| Linux child limits/environment | Instrument the deployed worker's analysis function in a real child to observe actual limits after its `main()` setup; use the handler's normal child environment | Verifies setup, not exhaustion resistance, filesystem/network isolation or credential reachability |
| PostgreSQL admission/release | Hold the actual application analysis lock and attempt it from a separate PostgreSQL connection; try again after release | Independent sessions in the separate task, not two HTTP workers or a capacity benchmark |

The probe writes no application models or reports and performs no HTTP uploads.
It creates bounded temporary synthetic files and briefly acquires session locks.
It never kills a normal Builder worker or task. Unexpected exceptions are
suppressed; a failed/missing check fails the workflow rather than printing raw
exceptions, environment values, filenames, scores, extracted text or logs.
Only fixed boolean checks, temporary-storage categories, and package versions are published. Task startup
logs remain in the existing restricted CloudWatch log group; the collector
prints only schema-validated probe output from that exact task's stream.

The runner waits at most five minutes for the task after launch, with a bounded
log-delivery grace period. Failure/interruption requests stopping only its own
probe task. Workflow cancellation or a failed stop request is not proof of task
termination: an infrastructure operator must confirm the probe is STOPPED
before retrying. The workflow has a 15-minute outer deadline. No IAM changes are
included; a denied operation is an explicit follow-up dependency.

## Record and interpret results

Record the workflow URL, source revision, inspected deployed Builder/task
revision, date and operator under #12568 and Builder #971. Record each boolean
as pass/fail; absent output is not a pass. Preserve the distinction between
unmodified synthetic processing and instrumented timeout/child-limit checks.
An encrypted fixture is generated from the supported fictional PDF in memory.

The task's storage belongs to a separate task. Passing results do **not** prove
normal-service worker interruption cleanup, production temporary-storage behavior,
upload receive deadlines/size rejection at ingress, logging privacy/retention,
full credential/network containment, production behavior or security/privacy
approval. Those remain separate rows in the
[Builder readiness plan](https://github.com/HHS/simpler-grants-pdf-builder/blob/main/documentation/readability/READABILITY_CALCULATOR_READINESS.md).
New Relic checks of the synthetic markers are separate restricted observations;
this workflow does not query New Relic or establish HTTP logging coverage.

Public enablement and production changes require separate decisions. Do not
close #12568 or Builder #970/#971 solely because this workflow passes.
