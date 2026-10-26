# Inspect the Readability Calculator in infra-dev

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568).
This manual workflow collects a configuration snapshot and recent metric-presence
observations. It does not deploy, submit documents, activate WAF rules, send
notifications, execute container commands, terminate tasks or inspect raw logs.

## Run it

After the PR is reviewed and merged:

1. Open **Actions → Inspect Readability Calculator → Run workflow** in
   `HHS/simpler-grants-gov`.
2. Select **main**. The inspection job refuses other branches and forks.
3. Run the workflow and open the job summary. There is no environment, role,
   command or recipient input: the target is fixed to NOFO **infra-dev** in the
   dev AWS account and `us-east-1`, matching the current app/network configuration.
4. Link the dated workflow result to #12568 and Builder
   [#970](https://github.com/HHS/simpler-grants-pdf-builder/issues/970)/
   [#971](https://github.com/HHS/simpler-grants-pdf-builder/issues/971). Record the
   workflow commit as well as the observed running image/task-definition revisions.

No personal AWS login or long-lived AWS credential is required. A repository user
who can dispatch workflows uses the existing GitHub Actions AWS role through
OIDC. The short session is restricted to the exact read operations in
`scripts/nofo_inspection_session_policy.json`; it cannot expand the role's
permissions. Unlike the deployment credential wrapper, this workflow does not
run Terraform or read its state. The script verifies the account before resource
queries. Nothing in this change grants new IAM or Slack permissions.

This workflow has not been live-verified by its offline tests. Organizational
policies, permission boundaries or deployed role differences may deny a read;
the result should identify that specific gap rather than assume a new operator
or broader permission is necessary.

## What the summary contains

| Check | Selected observations | What it does not establish |
| --- | --- | --- |
| Account/service | Expected-account match, desired/running/pending task counts and ECS Exec setting | Access to run commands, health of every request or public enablement |
| Running tasks | Image version tags and task-definition revisions actually referenced by running tasks; selected recording/retention environment settings; user/root-filesystem/capability/tmpfs declarations | Database-stored Constance flags, effective mounted storage, parser containment or successful cleanup |
| WAF | ACL association discovered through the service's target group; pilot rule modes, priorities, threshold/window and IP aggregation; metrics/sampling settings | Exact request matching, actual throttling, emergency block timing or live protection |
| Dashboard/alarms | Dashboard widget count; four expected alarm states, thresholds, notification settings and destination counts | Correct rendering, valid threshold selection, recipient identity or delivery |
| Subscriptions | Email/HTTPS/other subscription counts and pending-confirmation count for the fixed NOFO monitoring topic | That the intended inbox is subscribed, messages arrive or someone responds |
| Metrics | Datapoint counts in the last hour for ECS CPU/memory and WAF pilot Count/Block series using the observed ACL metric name | Zero traffic when data is absent, full-upload latency, worker occupancy or alarm correctness |
| Application log configuration | Retention and subscription-filter counts for the running containers' configured log groups | Content redaction, actual forwarding or infrastructure-wide logging coverage |

The service's configured task-definition revision and the running revisions can
differ during a deployment; both are reported. Unset environment values mean
**unset; application default not inspected**. No-expiration usage-record defaults
are documented in Builder; this workflow does not query its database or search
for scheduled cleanup jobs.

Raw AWS responses, account/resource identifiers, registry URLs, subscription
addresses, task-role/secret references, arbitrary environment variables, log
messages and exception text are not published. Only selected fixed labels,
booleans, counts and recognized revision/version strings enter the summary. There
is no raw-response artifact. Selected container configuration is still public
operational information: review the summary contract before dispatching, and
keep additional runtime/policy/log evidence in the approved restricted location.

## Interpret the result

- **observed** means the selected read completed. It is not a safety/health pass.
  Count-mode rules, disabled notifications and no subscriptions can all be
  successfully observed and still need follow-up.
- **incomplete**, **access_denied**, **not_found**, missing resources, truncated
  lists, timeout and response errors leave an explicit gap. Other independent
  reads continue when possible. Missing authentication fails before inspection;
  a wrong-account response stops all resource queries.
- The job exits nonzero for incomplete/failed checks. A complete inspection can
  exit zero with inactive controls or no metric observations; inspect the details.
- Per-request timeouts and a three-minute collector deadline bound inspection.
  ECS task discovery is limited to one page of at most 20 tasks; other one-page
  listings fail explicitly when truncated.

## Follow up only on demonstrated gaps

Use the existing [WAF verification guide](nofo-pdf-readability-waf.md),
[monitoring guide](nofo-pdf-readability-monitoring.md) and
[upload assessment](nofo-pdf-upload-assessment.md) for bounded behavior checks.
Read-only observations do not satisfy tests of actual blocking, notification
receipt, temporary-file cleanup or document-free logging. Coordinate any action
that changes shared controls, generates load or interrupts running workers.

Initial email setup and actual subscription/delivery testing remain separate;
this workflow does not subscribe an address or notify anyone. Slack/New Relic
integration is deferred under
[#12950](https://github.com/HHS/simpler-grants-gov/issues/12950).
Production inspection and public upload enablement are outside this workflow.
Builder [#968](https://github.com/HHS/simpler-grants-pdf-builder/issues/968) remains
the public-release decision tracker.

## Offline validation

```sh
python3 -m unittest discover -s scripts/tests -p test_nofo_inspection.py -v
```

Fixtures test account isolation, read-operation/session-policy parity, missing
resources/permissions, pagination, timeouts, actual-running versus configured
revisions and exclusion of synthetic sensitive markers. CI runs these without
AWS credentials or network requests. Workflow linting runs through the existing
infrastructure CI.
