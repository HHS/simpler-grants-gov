# NOFO PDF readability WAF controls

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568),
items 1–3. This is an infrastructure foundation for the anonymous PDF pilot,
not release approval. Its [Builder release gate](https://github.com/HHS/simpler-grants-pdf-builder/issues/968)
and [safeguards verification](https://github.com/HHS/simpler-grants-pdf-builder/issues/970)
remain open. Authenticated Builder saved readability history is outside this pilot.

## Configuration and initial deployment

The shared service module accepts `pdf_readability_waf`, defaulting to `null`.
Null adds no rules and preserves the existing managed-rule priorities. Validation
rejects opt-in for non-NOFO service names and services without a load balancer.
Workspace-prefixed NOFO service names are supported.

NOFO environment configuration passes this object through `service_config` to
the service module. Only `infra/nofos/app-config/infra-dev.tf` opts in:

```hcl
pdf_readability_waf = {
  rate_limit      = 10
  rate_action     = "count"
  emergency_block = false
}
```

Both rules initially observe in Count mode; this does **not** enforce throttling
or block the route. Production and every other environment remain opted out.
The current `Deploy NOFOs` workflow maps its `dev` selection to `infra-dev`.
Confirm the selected infrastructure revision, environment, account, and HTTPS
endpoint before testing. The workflow's `version` input selects the Builder
application version, not an independent infrastructure revision; infrastructure
comes from the workflow checkout.

| Rule | Priority | Scope | Activation |
| --- | --- | --- | --- |
| `NOFO-PDFReadability-EmergencyBlock` | 0 | GET and POST; exact `/readability-checker`, `/readability-checker/`, `/readability`, or `/readability/` URI path | `emergency_block = true` returns WAF's default 403 |
| `NOFO-PDFReadability-UploadRate` | 1 | POST; same four URI paths; per WAF-observed source IP | `rate_action = "block"` returns 429 near the configured rate |
| Existing managed groups | 2–8 when opted in | Existing scope/actions | Relative ordering and Allow overrides preserved |

Both rule matchers cover the current public `/readability-checker/` route and
the legacy `/readability/` redirect, each with or without the trailing slash.
They use anchored alternatives without capturing subexpressions, which AWS WAF
[does not support](https://docs.aws.amazon.com/waf/latest/developerguide/waf-regex-pattern-support.html).
Matching remains case-sensitive, with no text transformations;
query strings are separate from the URI path. These rules do not match child
paths, the authenticated `/nofos/readability-checker/` route, GET rate counts, or
other methods. Both public path families share one per-source-IP rate budget;
renaming or alternating between the two does not create a second configured
rate rule. Alternate encoded/normalized route
forms are not claimed covered; assess them separately before launch.

The rate window is 300 seconds. The integer rate limit is configurable from
10 to 2,000,000,000, per AWS WAF's supported range. Ten is a provisional dev
starting point, not an approved production capacity limit. Enforcement is
approximate, so the eleventh request is not guaranteed to be blocked. Changing
a rate rule can temporarily reset its counters. Shared office IPs can combine
legitimate users. The rule uses `IP`, not an untrusted forwarded-IP header;
verify the observed source address in the deployed topology before relying on
per-client behavior.

Both pilot rules precede all managed groups, including terminating Allow
overrides. Count is non-terminating; an activated emergency block stops further
evaluation before rate limiting. Each rule has a CloudWatch counter and disables
its own sampled requests. Existing ACL/managed-group sampling and WAF/ALB logs
are unchanged: this is not a logging-redaction or privacy-control change.

The infra-dev environment remains in Count mode with emergency blocking off.
Correcting the path scope does not enable enforcement or public uploads. Merging
service-module changes can automatically deploy dev; confirm the actual path
matchers and unchanged Count actions afterward. Live blocking/restoration still
requires the bounded verification procedure below.

## Local checks

Use Terraform 1.14.3, matching CI. All tests below use mocked providers, need no
AWS credentials, and do not create resources:

```sh
terraform -chdir=infra/modules/service init -backend=false -lockfile=readonly
terraform -chdir=infra/modules/service validate
terraform -chdir=infra/modules/service test
terraform -chdir=infra/nofos/app-config init -backend=false -lockfile=readonly
terraform -chdir=infra/nofos/app-config test
```

Service tests cover default behavior, rule order/actions, path and method
configuration, source-IP aggregation, rate bounds, independent activation, and
NOFO-only validation. The environment test verifies that only `infra-dev` opts
in and both actions begin in Count mode. CI runs both suites. These tests verify
planned configuration, not AWS request matching, effective IAM, drift, or live
capacity.

## Coordinated dev verification

Execution is tracked in [#13085](https://github.com/HHS/simpler-grants-gov/issues/13085).
This procedure prepares enforcement testing; merging it does not activate rules.
Keep public uploads disabled throughout. Target only
`https://nofos.dev.simpler.grants.gov` in `infra-dev`, never production.
Use no documents, multipart bodies, authenticated sessions, slow uploads or
oversized requests.

### Execution gate and existing control path

The existing tools are sufficient for staged configuration changes:
`Deploy NOFOs` (`.github/workflows/cd-nofos.yml`) deploys reviewed Terraform;
`Inspect Readability Calculator` (`inspect-nofo-readability.yml`) reads
configuration and counters. The inspection session cannot change rules.

Before activating either rule, record the operator, infrastructure reviewer,
fallback contact, test window, selected SGG revision, and restoration path in
the execution issue. Confirm public uploads are off in Builder configuration and
by the unavailable-page baseline. The inspection does not read database-backed
feature flags.

The merge-triggered deployment builds Builder's current `main`; it does not
honor a separately selected Builder version. For a bounded dev session, the
named deployment owner must confirm that no unrelated Builder deployment is
planned, record the actual deployed Builder commit after each stage, and check
the stage-specific responses below after each deployment, using that stage's
existing request allowance rather than an additional baseline pass. During
emergency blocking, expect WAF 403 on all scoped paths, not the application's
unavailable page. Verify the stored public-uploads flag remains off through
Builder administration or another authorized configuration read; the WAF 403
cannot establish the application's flag state. Stop and investigate unexpected
responses or configuration changes. A formal Builder-main freeze or a
revision-aware deployment path may be used when required by the environment,
but neither is required for this dev-only procedure.

For each activation or restoration stage, update `pdf_readability_waf` in
`infra/nofos/app-config/infra-dev.tf` **and** every Terraform test that asserts
the WAF mode: currently `tests/pdf_readability_waf.tftest.hcl` and
`tests/pdf_readability_monitoring.tftest.hcl`. The tests must continue to assert
the rate threshold, dev-only opt-in, private notification routing and every
other environment's null configuration. Update only the temporary mode
expectation: rate `block` for rate and emergency stages, and emergency `true`
only for the emergency stage. The final restoration change must return both the
configuration and test expectations to rate `count` and emergency `false`.

Keep the threshold at 10 and the window at 300 seconds. Do not edit shared
modules, other environments, recipients, IAM or managed rules. Inspect the
deployment plan for unrelated changes; stop for review if present. The existing
deployment path also runs migrations and deploys the application, so it is not
an isolated WAF update.

**Activation still needs reviewed configuration changes.** This procedure does
not supply a new toggle or grant AWS permissions. Agree the review and deployment
availability for every stage, including restoration, before the first activation.
If the full deployment path cannot provide a usable restoration route, stop and
resolve that dependency with the infrastructure maintainer before testing.

Changes under `infra/nofos/**` can trigger an automatic NOFO dev deployment on
merge. Treat merging each activation change as the beginning of that stage;
do not queue all stages at once or dispatch a duplicate deployment. A manual
dispatch's application `version` does not select an older infrastructure
revision. Restoring requires the reviewed configuration below, not merely
redeploying an old Builder image. This documentation-only change does not match
the application deployment path filters.

### Stages and request ceilings

Use these exact paths without following redirects:
`/readability-checker`, `/readability-checker/`, `/readability`, `/readability/`.
Use one stable source for rate testing; record its identity only in restricted
evidence. Each POST must have an empty body. Set a 10-second request timeout and
disable automatic retries. Record UTC time, method, path and response status;
do not publish response bodies, cookies, IP addresses or raw logs.

| Stage | Reviewed configuration | Request ceiling | Required evidence |
| --- | --- | --- | --- |
| Baseline | rate `count`, emergency `false`; baseline Terraform expectation | One GET and one empty POST per path, plus GET `/health`: 9 | Record each baseline without following redirects. Canonical GET shows unavailable (200); empty POST may be rejected by CSRF (403), so status alone cannot prove WAF interception. Health remains available. |
| Rate enforcement | rate `block`, emergency `false`; matching stage-specific Terraform expectation | Up to 44 empty POSTs distributed across the four paths, at most one every two seconds; one GET per path and GET `/health`: 49 | Verify effective modes first. Corroborate 429s with rate-rule BlockedRequests. GETs and health retain baseline behavior. Record each form actually verified. |
| Rate recovery | Keep rate `block`, emergency `false` | Stop burst; at most one empty POST per minute, up to 10, plus one GET per path: 14 | Return to baseline after the rate window. Record elapsed time and the last burst request. |
| Emergency enforcement | rate `block`, emergency `true`; matching stage-specific Terraform expectation | One GET and empty POST per path, plus GET `/health`: 9 | All eight scoped requests return 403; emergency BlockedRequests corroborate interception. Health remains available. The higher-priority emergency rule terminates before the rate rule. |
| Restoration | rate `count`, emergency `false`; baseline Terraform expectation restored | Repeat baseline: 9 | Inspection confirms original modes; expected disabled-page responses and unrelated-route availability return. |

The whole session has a **90-request ceiling**, including all post-deployment
HTTP checks. Reserve the final nine requests for restoration; do not add a
separate baseline pass between stages. Each active rate/recovery phase
has a 10-minute wall-clock ceiling excluding deployment time. Stop POST traffic
early once adequate interception evidence is obtained. Rate enforcement is
approximate; request eleven is not a promised boundary. No block within these
bounds is inconclusive: restore and investigate, never increase load to force
a result. A single source does not establish shared-office-IP fairness.

After each deployment, use the read-only inspection to verify effective modes,
paths, priorities and rate settings before requests. Let counters publish before
inspecting again; its query covers only the last hour. Capture a pre-stage and
post-stage result, since cumulative sums may include other traffic. Missing data
is not zero. Corroborate with restricted rule-specific evidence if totals or
response codes are ambiguous. Do not rerun traffic merely to obtain a green check.
Blocking may trigger the existing dev WAF alarm emails; label the agreed window
as a test for responders and keep notification settings unchanged.

### Stop and restore

Stop on unexpected impact, public upload enablement, configuration mismatch,
unrelated-route failure, unexpected 5xx, request/time ceiling, or interruption.
Restoration is the next operation even if rate recovery or emergency verification
was inconclusive. Apply the reviewed infra-dev baseline:

```hcl
pdf_readability_waf = {
  rate_limit      = 10
  rate_action     = "count"
  emergency_block = false
}
```

Wait for deployment completion and inspect the actual modes, then perform the
nine restoration requests within the session budget. If permission or deployment
fails, immediately use the agreed infrastructure fallback and report the exact
failure. Never delete the ACL or managed protections. No automatic timed rollback
exists in this path; a failed or abandoned test does not restore itself.

### Recording completion

Keep a row for each stage in the execution issue: SGG commit, Builder image,
deployment/inspection links, UTC start/end, request count, observed response
counts, relevant counter deltas, pass/inconclusive/fail, and restoration result.
Record activation and restoration durations; do not claim an emergency SLA yet.
Keep detailed logs and source identities restricted. Link the sanitized summary
to #12568 and Builder #970/#971.

Close the enforcement execution issue only after rate blocking, recovery,
emergency blocking, unrelated-route availability and restoration have evidence.
This does not complete runtime cleanup, privacy review, production monitoring
or public-release approval.

## Emergency activation and restoration

The implemented configuration path is to change `emergency_block` in the target
NOFO environment's `pdf_readability_waf` object, review/merge the change, and use
`Deploy NOFOs` for that environment. A null configuration must first opt in before
it has an emergency rule. Review the plan; never apply a dev object to production
or assume changing the application `version` selects infrastructure from a PR.

Only someone authorized for the repository review/deployment path and its AWS
role may activate it. Repository write access alone does not prove operational
permissions. Record a named primary operator and fallback contact before launch.
Activation through this full deployment path has no established emergency SLA;
measure it in dev. If it is too slow, agree a separate expedited mechanism before
launch. An approved console/API activation would require separately authorized
AWS access and a procedure to reconcile Terraform so a later deployment does not
silently undo an incident block.

For restoration, return `emergency_block` to false through the agreed path and
verify all four current/legacy route forms and unrelated routes. Restore the
pre-incident rate mode and keep the application pilot flag in its agreed state. Do not delete the rules
or alter managed protections as a shortcut.

Before this is a tested incident procedure, record the actual operator, fallback,
activation mechanism, measured timing, notification channel, restricted evidence
location, and links back to #12568 and the Builder safeguards/operations tickets.
These are outstanding verification items, not completed by this document.

## Remaining boundaries

Rate limiting does not solve slow uploads, distributed abuse, parser isolation,
full-request size enforcement, temporary-file retention, or notification delivery.
No alert subscriptions, permissions, runtime evidence collector, production
opt-in, or pilot enablement are added here. Promote agreed controls to production
only after dev evidence and the separate reviews; public enablement remains gated.

References: [AWS rate settings](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based-high-level-settings.html),
[AWS rate caveats](https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based-caveats.html),
and [infrastructure changes](./making-infra-changes.md).

## Inspecting missing Count evidence

The read-only `Inspect Readability Calculator` workflow follows the dev ECS
service's target group to its load balancer and associated ACL. Its WAF summary
now reports `scope_matches_reviewed_paths_and_methods` for each selected rule.
True means the exact reviewed path/method structure (including NONE transforms)
was found; false means different or missing structure, not proof that no path
matches. It accepts either ordering of the two AND clauses and the AWS CLI's
base64 representation of the fixed POST byte string. It never prints arbitrary
rule statements, metric names, resource identifiers or request data.

Metric queries use the deployed ACL **resource name** for WebACL and each rule's
VisibilityConfig metric name for Rule, with Region us-east-1. The report includes
numeric WAF sums for the last hour. Missing sums remain null. Aggregate counters
cannot establish which individual request/path matched; other traffic may contribute.

The October 28 baseline initially returned empty series because the inspection
queried the ACL visibility metric name instead of the published resource-name
dimension. That defect was fixed by #13083 and verified in
[#13082](https://github.com/HHS/simpler-grants-gov/issues/13082).
On October 29, three document-free canonical GET requests at 21:55:45–21:55:49 UTC
returned the unavailable page. The
[post-deployment inspection](https://github.com/HHS/simpler-grants-gov/actions/runs/40961965615)
retrieved one emergency CountedRequests datapoint totaling three. Both rules
remained in Count mode. This establishes a working counter query and evidence
consistent with canonical-route matching; it does not prove all route forms,
rate enforcement, blocking, restoration or alarm delivery.

Use the bounded stages above for enforcement verification. Keep public uploads
disabled and leave observation mode in place until the activation configuration
and restoration path are reviewed.
