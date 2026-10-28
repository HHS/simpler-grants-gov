# NOFO dev overnight error diagnostic

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568).
This is read-only triage of the actual dev application-5xx notifications received
overnight on October 27–28, 2026. It is separate from the completed synthetic
alarm-delivery test and from activation of calculator notifications.

## Run after review and merge

Use **Actions → Diagnose NOFO dev overnight errors → Run workflow → main**.
No personal AWS login, new secret or recipient input is needed. The workflow
assumes the existing fixed dev AWS role with a restrictive read-only session
policy; that policy does not expand the role's underlying permissions. A denied
check reports only a safe category alongside the failed check. An infrastructure
maintainer may need to review that specific permission.

There are no user-supplied queries, log groups, dates or arbitrary AWS commands.
The reviewed script fixes these UTC windows, with margins around the emailed
alarm datapoints:

| Eastern time | UTC start (inclusive) | UTC end (exclusive) |
| --- | --- | --- |
| October 27, 10:25–10:46 p.m. EDT | October 28, 02:25 | October 28, 02:46 |
| October 28, 4:24–4:49 a.m. EDT | October 28, 08:24 | October 28, 08:49 |

The workflow reads only `service/nofos-infra-dev` application logs and the
`nofos-infra-dev-high-app-5xx-count` alarm's history. CloudWatch metric reads
require an IAM wildcard resource; the session restricts their region and the
script fixes the dev load-balancer and ECS service dimensions. No production
logs, log unmasking, SSM/secret reads, ECS commands, state changes, email sends or
infrastructure writes are authorized. The workflow reads original log events
into process memory, then emits only a purpose-built summary to the Actions log
and step summary. No raw response, artifact or raw-log file is produced.

## What the summary means

For each window it reports:

- Whether the bounded log scan completed, and how many log events it scanned.
- Error-log-event counts, numeric 5xx status counts, broad fixed route families,
  and known exception-class counts. Unknown classes become `unknown`; URLs,
  query strings, IDs, exception messages, tracebacks, filenames, documents and
  stream names are never copied to output.
- Counts of non-JSON/unrecognized events, including a fixed worker-timeout
  marker where present. Unrecognized events are not assumed to be errors.
- Application 5xx, load-balancer 5xx and request-count metric sums, plus the
  largest one-minute average CPU/memory utilization in the window. Missing
  datapoints are reported as null, never as proof of zero errors or traffic.
- The number of alarm state-update records and whether the alarm-history read
  was complete. Reasons and notification bodies are suppressed.

A request can generate multiple log entries. Do not equate log-event counts with
unique requests or assume that separate route and exception totals identify the
same request. The ALB metric and application logging may cover different
requests, especially errors occurring before structured logging or on paths
excluded from that logging. The diagnostic does not inspect historical task
termination, deployment records or the current application health.

Each window reads at most ten pages of up to 500 log events. Empty pages with a
continuation token are followed. Repeated tokens, the page limit or the scan's
shared 180-second deadline mark results incomplete. AWS calls have bounded
connect/read timeouts and no automatic retry; the whole job times out after
seven minutes. A missing/denied check or incomplete scan makes the run fail while
retaining any other safe results. A green run means collection completed, not
that an error was fixed or root cause proven.

## Follow-up

Compare the 5xx metrics with the safe route/exception labels and available
capacity signals. If a known error pattern emerges, investigate the relevant
application code and reproduce with synthetic inputs before proposing a fix.
If the result is unknown, incomplete, or lacks enough context, an authorized
maintainer should inspect the original restricted logs and relevant deployment
or task history; do not expose raw log data in public Actions output to resolve
that gap. Keep shared monitoring notifications active during investigation.

Record a workflow link and a short sanitized finding once reviewed. Do not copy
email unsubscribe links, recipient addresses or raw errors into public evidence.
Changing the incident windows or expanding the data read requires another
reviewed change. No live diagnostic has been run merely by merging this workflow.

References: [CloudWatch FilterLogEvents pagination](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_FilterLogEvents.html),
[metric statistics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_GetMetricStatistics.html).
