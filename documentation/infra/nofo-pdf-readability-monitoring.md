# NOFO PDF pilot monitoring and alert routing

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568), item 9.
This adds an operations dashboard and alarm definitions, not a completed
monitoring/support sign-off or permission to launch the anonymous pilot.

## What the dashboard is

The dashboard is an AWS CloudWatch page named
`nofos-infra-dev-pdf-readability`, not a Builder UI page. It shows aggregate
infrastructure signals without extracting PDF content or adding request-log
collection:

- Counted and blocked matches for the emergency and upload-rate WAF rules from
  [#12661](https://github.com/HHS/simpler-grants-gov/pull/12661), plus all-route
  WAF blocks.
- Service-wide load-balancer/application errors and forwarded requests.
- Service-wide target response time (average and p95).
- Service-wide ECS CPU and memory utilization.

Rate-rule CountedRequests measures over-threshold matches, not every upload.
Emergency-rule Count matches GET/POST on the pilot route, not unique users or
successful analyses. All-route WAF blocks and ALB/ECS signals include ordinary
Builder traffic. Do not add these counters together as a request total.
TargetResponseTime does not establish the total time spent uploading. CPU and
memory are capacity indicators, not synchronous worker occupancy; low values do
not establish slow-upload protection. Missing/empty data does not prove safety.

WAF rule-specific series require #12661 to be deployed and matching traffic to
reach the rules. This PR is based on main and can be reviewed independently; it
does not include or activate those rules. No complete live dashboard or alarm
behavior is claimed from mocked tests.

## Initial configuration and metric identity

Only the `infra-dev` NOFO environment opts in to the dashboard and four pilot
alarms. Production, other NOFO environments, and other services remain opted
out. New pilot alarm actions start disabled; no email address or incident
integration is invented. Existing generic alarm behavior is unchanged.

AWS/WAFV2's `WebACL` dimension uses the ACL's **visibility metric name**, not
its resource name or ARN. The existing service module default is the shared
`WAF_Common_Protections` label. A monitored NOFO environment explicitly sets a
unique label (`nofos-infra-dev-waf`) and exports its actual value to monitoring.
The two rule metric names are `NOFO-PDFReadability-EmergencyBlock` and
`NOFO-PDFReadability-UploadRate`; `Region` is also specified.

This changes the dev ACL's metric identity without changing WAF actions or
priorities. Old metric history remains under the old label. Review and update
any external dev dashboard/alarms using that label, and verify the published
metric dimensions after deployment. Other services retain their existing label.

## Alarm definitions

| Alarm | Trigger | Missing data | Notification state initially |
| --- | --- | --- | --- |
| Emergency-rule blocks | At least one block in a one-minute period | Not breaching; WAF counters are sparse | Disabled |
| Upload-rate-rule blocks | At least one block in a one-minute period | Not breaching; Count observations do not alarm | Disabled |
| Service CPU | Average at least 80% in three of five one-minute periods | Missing/insufficient data remains visible | Disabled |
| Service memory | Average at least 80% in three of five one-minute periods | Missing/insufficient data remains visible | Disabled |

Utilization thresholds are configurable and provisional for dev, not approved
production capacity values. Existing error/latency alarms remain in place.
SNS notifications occur on alarm state transitions, not once per blocked
request. An intentionally activated emergency block can produce an expected
alarm when requests arrive; interpret it using the incident procedure.

## Existing repository pattern and options

This reuses the shared `infra/modules/monitoring` module: CloudWatch alarms
publish to the environment's SNS topic, which can have email subscriptions or
an external incident-tool subscription. Frontend and analytics already pass
email routing into this module; their checked-in recipient lists are empty.
The [existing notification guide](./monitoring-alerts.md) documents email and
incident-tool setup. Source support does not prove current deployed delivery.

| Option | Benefit | Limitation |
| --- | --- | --- |
| Shared team email | Existing SNS mechanism; no incident tool needed; ownership can be shared | Confirm the subscription and agree who watches/responds; no automatic escalation |
| Personal email | Simple initial test | Single-person dependency and handoff risk |
| Existing incident tool | Can support acknowledgment, escalation, and on-call routing | Requires an agreed endpoint, ownership, and integration setup |
| Dashboard and silent alarms | Review/test signals without selecting a recipient yet | No proactive notifications; viewing still requires appropriate AWS access |

The initial configuration uses the last option. The Terraform output exposes
the dashboard name and SNS topic ARN, but does not grant anyone AWS or dashboard
access. A deployment operator may lack interactive viewing rights. Before
launch, verify that the named Builder monitor and fallback can inspect signals
or receive an approved delivery mechanism. The staff-only Builder pilot-usage
page remains a different, application-level monitoring source; it cannot show
requests rejected by WAF.

## Configuring recipients later

Keep internal team addresses out of public PRs and issue comments unless the
team explicitly approves publication. This PR configures no actual recipient.
The checked-in environment setting below is suitable only for an address
approved for public disclosure. For a private address, an authorized
infrastructure operator must agree and implement a private configuration path
or manage the subscription outside this Terraform resource without creating
ownership conflicts. No private input path is introduced by this PR.

Email recipients do not need AWS or PagerDuty access to receive notifications
and confirm the subscription link. An operator must verify resource deployment
and actual delivery, and a named responder with AWS viewing access must be
available to investigate. Deployment workflow access alone does not establish
interactive AWS access or all permissions needed to create these resources.


Each NOFO environment can set:

```hcl
# In the appropriate infra/nofos/app-config/<environment>.tf module call:
monitoring_email_alert_recipients = ["agreed-team-inbox@example.com"]
pdf_readability_alarm_actions_enabled = false
```

The example is a placeholder, not a configured destination. These addresses
subscribe to the **shared NOFO monitoring topic**, so existing generic service
alarms can send messages there even while new pilot actions are disabled.
Review the inbox choice with that scope in mind. SNS sends a subscription
confirmation that the recipient must accept; Terraform configuration does not
prove confirmation or delivery.

After agreement and a coordinated synthetic delivery test, explicitly set
`pdf_readability_alarm_actions_enabled = true` for the intended environment.
Validation rejects activation without monitoring and an explicit email
recipient or existing incident integration. It cannot verify that an email
subscription is confirmed, that an integration works, or that someone responds.
Keep delivery verification and named ownership open until demonstrated.

For an existing incident tool, use the module's existing integration path and
approved SSM configuration documented in the notification guide. Do not place
integration secrets in code, public issues, or workflow logs. No integration is
activated here. Additional dashboard/alarms may incur ordinary CloudWatch costs.

## Checks and coordinated dev verification

Use Terraform 1.14.3, matching CI:

```sh
terraform -chdir=infra/modules/monitoring init -backend=false -lockfile=readonly
terraform -chdir=infra/modules/monitoring validate
terraform -chdir=infra/modules/monitoring test
terraform -chdir=infra/modules/service init -backend=false -lockfile=readonly
terraform -chdir=infra/modules/service test
terraform -chdir=infra/nofos/app-config init -backend=false -lockfile=readonly
terraform -chdir=infra/nofos/app-config test
```

All tests use mocked providers and create no infrastructure. CI runs the module
suites and NOFO environment configuration test. They check resource opt-in,
metric dimensions, dashboard JSON structure, action gating, destinations, and
threshold handling. They do not test actual metric publication, dashboard
rendering, effective AWS access, subscriber confirmation, or delivery.

Before relying on monitoring:

1. Coordinate the dev window and review the plan: one dev dashboard, four pilot
   alarms, a unique dev WAF metric identity, no recipients/actions activated,
   and no production resources. Merging these paths may automatically deploy
   dev through `Deploy NOFOs`; its `dev` option maps to `infra-dev`.
2. Verify the actual environment and published WAF/ECS/ALB dimensions; inspect
   the dashboard and confirm expected series. Check existing consumers of the
   old WAF metric label. Empty series awaiting #12661 are not test evidence.
3. Reuse the bounded synthetic WAF tests from #12661 while the application
   pilot stays off. Verify Count observations versus Block counters and the
   corresponding alarm state transitions. Do not generate load to force CPU
   or memory alarms without separate test coordination.
4. Agree primary/fallback monitoring ownership and AWS viewing access or alert
   delivery. If routing is configured, confirm the subscription and perform
   an approved synthetic delivery/recovery test before claiming it works.
5. Record dated evidence, any empty/missing signals, thresholds, destination,
   ownership, and limitations in #12568 and Builder #970/#971. Keep detailed
   runtime configuration and evidence in the approved restricted location.

No production opt-in, public pilot enablement, new AWS viewing permissions,
request-body logging, or completed operational/security approval is included.
Authenticated Builder saved readability history remains outside this pilot.

References: [AWS WAF dimensions](https://docs.aws.amazon.com/waf/latest/developerguide/waf-metrics.html),
[ECS service metrics](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/available-metrics.html),
and [Builder release gate](https://github.com/HHS/simpler-grants-pdf-builder/issues/968).
