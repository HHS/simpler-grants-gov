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
| `NOFO-PDFReadability-EmergencyBlock` | 0 | GET and POST; exact `/readability` or `/readability/` URI path | `emergency_block = true` returns WAF's default 403 |
| `NOFO-PDFReadability-UploadRate` | 1 | POST; same two URI paths; per WAF-observed source IP | `rate_action = "block"` returns 429 near the configured rate |
| Existing managed groups | 2–8 when opted in | Existing scope/actions | Relative ordering and Allow overrides preserved |

Both URI matches are anchored, case-sensitive, with no text transformations;
query strings are separate from the URI path. These rules do not match child
paths, GET rate counts, or other methods. Alternate encoded/normalized route
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

Keep `HHS_NOFO_PDF_METRICS_PILOT_ENABLED` off. Obtain coordination for the test
window and use synthetic requests only; no real documents or production tests.
An empty POST can verify WAF interception without enabling PDF analysis.

1. Review the dev Terraform plan and confirm only the intended NOFO ACL gains
   the two rules and shifted managed priorities. Confirm workflow permissions.
   Use the existing reviewed deployment path; merging an infrastructure change
   can trigger a dev deployment automatically.
2. Verify the deployed ACL association, priorities 0/1 ahead of managed Allow
   actions, action modes, rate/window, and source-IP aggregation. Record the
   running infrastructure revision and environment; keep detailed configuration
   and log evidence in the approved restricted location.
3. In Count mode, send bounded GET/POST requests to both exact route forms and
   GET to an unrelated Builder route (for example `/health`). Confirm the pilot
   is still disabled and inspect the corresponding rule counters. Check query
   strings, excluded paths/methods, and any additional route aliases separately.
4. Through a reviewed dev configuration change, set `rate_action = "block"`
   while retaining `emergency_block = false`. Send a bounded burst above the
   provisional threshold, allowing for AWS evaluation/propagation delays. Verify
   429 interception, GET exclusion, unrelated-route availability, and eventual
   recovery. Pre-agree a request/time ceiling; if enforcement is not observed,
   stop and investigate rather than escalating load. Assess shared-IP behavior
   and confirm whether WAF sees a client or an upstream proxy address.
5. Set `emergency_block = true` through the same controlled path. Verify GET
   and POST for both route forms return WAF 403, independent of Django, while
   unrelated Builder routes remain available. The emergency rule should be the
   terminating rule even if rate limiting is active.
6. Restore `emergency_block = false` and `rate_action = "count"`, redeploy, and
   verify restoration, disabled pilot responses, and unrelated routes. Record
   measured activation/restoration time and any failures.

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
verify both route forms and unrelated routes. Restore the pre-incident rate mode
and keep the application pilot flag in its agreed state. Do not delete the rules
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
