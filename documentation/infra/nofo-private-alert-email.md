# Private NOFO monitoring email routing

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568).
The requester selected a team inbox privately. Do not copy it into public code,
issues, plans, workflow logs or screenshots. Slack/New Relic integration remains
follow-on work under [#12950](https://github.com/HHS/simpler-grants-gov/issues/12950).

## Prepared configuration

The monitoring module accepts `email_alert_recipient_parameter_name`, an optional
SSM **SecureString** parameter path containing exactly one email address. NOFO
exposes it as `monitoring_email_alert_recipient_parameter_name` in each environment
module. Both default to null. The infra-dev configuration now selects
`/nofos/infra-dev/monitoring/alert-email`; every other environment retains null.
Public recipient lists remain empty. Infra-dev now selects calculator alarm
actions on after the controlled alarm/recovery check and both inbox receipts;
other environments remain off. Applying the configuration is still required
for the dev action setting to take effect. See the
[activation and threshold review](nofo-pdf-readability-monitoring.md#dev-notification-activation-and-threshold-review).

The encrypted parameter was created successfully in
[setup run 40514626054](https://github.com/HHS/simpler-grants-gov/actions/runs/40514626054).
That establishes creation, not the deployment role's read/decrypt access or email
delivery. Merging this infrastructure change can trigger the normal dev deploy.
After it succeeds, check the selected inbox for an AWS subscription-confirmation
message. Do not publish its address or confirmation link. Confirm privately,
then test topic delivery and alarm routing before enabling calculator actions.

The private endpoint remains Terraform-sensitive in ordinary plans. It uses a
stable subscription index, rather than putting the email in a `for_each` resource
key. The private route and public recipient list are mutually exclusive to avoid
duplicate or inadvertently public endpoint configuration.

**Restricted Terraform state still contains the resolved address**, and the AWS
SNS service stores the endpoint. Encryption in Parameter Store is not a promise
that the value is absent from state. Keep state, saved plans and machine-readable
plan/state output restricted; do not publish `terraform show -json` or raw SNS/SSM
responses. The email is not passed to application containers or exposed as an
output. Existing non-NOFO callers keep their previous behavior by default.

## Activate later, after review

1. Start with infra-dev; confirm account/region and the exact target service.
   Using an approved AWS tool or a reviewed GitHub workflow, provision a
   SecureString parameter containing the selected inbox. Enter its value through
   a private/secret input, not a shell command echoed into logs or history.
   An example parameter **name**, not an email, is
   `/nofos/infra-dev/monitoring/alert-email`. This PR does not provision that value
   or add a parameter-writing workflow.
2. Confirm the deployment role can read/decrypt this parameter (and a custom KMS
   key, if selected). Source permissions alone are not proof of effective access.
   Resolve a specific denied read rather than broadly expanding IAM permissions.
3. In the target environment module, set only the parameter path:

   ```hcl
   monitoring_email_alert_recipient_parameter_name = "/nofos/infra-dev/monitoring/alert-email"
   pdf_readability_alarm_actions_enabled           = false
   ```

   Review/apply through the existing deployment path. The parameter must exist
   before this configuration is planned. A missing parameter, plaintext parameter
   or invalid address should fail the plan rather than silently omit routing.
   Keep all other environments unchanged. Merging NOFO infrastructure paths can
   trigger dev deployment; do not opt in until the private parameter is ready.
4. SNS sends a subscription-confirmation email. Someone with inbox access accepts
   it. Verify confirmation privately; never print the confirmation URL or address.
   The topic is shared with generic Builder alarms, whose actions already exist,
   so the inbox may receive those even while calculator-specific actions are off.
5. Follow the [short delivery checklist](nofo-readability-verification-kit.md).
   Test receipt/recovery through an agreed synthetic method, distinguish direct
   topic delivery from alarm routing, and record results without publishing the
   endpoint. No real service disruption/load is needed just to test delivery.
6. After recipient readiness and verification, make a separate explicit change to
   enable the calculator alarm actions in that environment. Do not infer delivery
   or operating coverage from Terraform success or subscription confirmation alone.

This supports initial email delivery; it neither enables public uploads nor
completes the safeguards/release issues. A later production opt-in needs its own
review and deployed verification. We can prepare the private parameter setup
through GitHub if existing access supports it; a personal AWS-console login is
not inherently required.

## Controlled topic-to-inbox test

After the subscriber confirms privately, use **Actions → Test NOFO dev alert
email delivery → Run workflow → main**. This manually sends one message with
subject **TEST: NOFO Builder dev email delivery** to the fixed dev monitoring
topic. No new secret, recipient input, alarm change or upload enablement is used.
It requires exactly one confirmed email subscription and fails without publishing
if routing differs or remains pending. Raw AWS responses, endpoint addresses and
confirmation links are never printed. Its AWS session can only check subscriptions
and publish to that topic; source IAM permissions are not expanded.

A successful run means SNS accepted publication. An inbox holder must verify the
labelled test arrived and record that receipt. A timeout can leave publication
status uncertain; check privately before manually retrying to avoid duplicate
messages. An access denial needs the specific SNS permission reviewed, not broad
role access. This direct topic test does not prove CloudWatch alarm/recovery
delivery. This direct test does not activate calculator actions; the environment
setting is changed separately through review and deployment.

## Controlled CloudWatch alarm and recovery test

The dev route was deployed, its subscription confirmed privately, and the direct
SNS test was received after
[delivery run 40570559443](https://github.com/HHS/simpler-grants-gov/actions/runs/40570559443).
The next test exercises CloudWatch notification actions, without changing an
existing calculator alarm or generating application traffic.

After this workflow is reviewed and merged, use **Actions → Test NOFO dev alarm
and recovery email → Run workflow → main**. No new secret, inbox input or personal
AWS-console access is required. The workflow uses the existing GitHub AWS role;
its session policy is narrowed to the single test alarm for that run and attempt,
plus subscription inspection on the fixed dev monitoring topic. It does not grant
new permissions to the underlying role. A denied operation needs focused
infrastructure review; the workflow reports only an allowlisted operation/error
category, never the raw AWS response.

The workflow:

1. Requires exactly one confirmed email subscription. Recipient values are never
   printed. It refuses to modify an alarm that already exists under its test name.
2. Creates `NOFO-DEV-TEST-alert-delivery-<run-id>-<attempt>` with ALARM and OK
   notification actions pointing to the existing dev topic. It uses an isolated,
   unpublished synthetic metric and ignores missing data to preserve the test
   state. No real service thresholds, WAF rules or upload settings are changed.
3. Uses AWS's supported
   [SetAlarmState test mechanism](https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_SetAlarmState.html)
   to request ALARM, waits for a successful SNS action in CloudWatch history,
   then requests OK and checks its action separately. Each wait is bounded;
   raw history and embedded notification bodies are never logged. Unexpected
   history formats fail verification rather than assuming success.
4. Deletes the owned test alarm in a finally block and checks removal. A separate
   always-run cleanup step retries deletion after failure or cancellation when
   the runner and credentials remain available. A creation timeout also attempts
   cleanup because AWS may have accepted the request.

An inbox holder must confirm **both** messages, identified by the test alarm name
and the ALARM and OK states. AWS may use its standard alarm-email subject format;
expect the alarm name beginning `NOFO-DEV-TEST`, rather than the earlier direct
SNS test subject. Record the workflow link and receipt of each state, without
copying addresses, subscription links or email bodies into public evidence.
A green workflow confirms successful notification actions and cleanup, not inbox
receipt, threshold evaluation, calculator alarm configuration, or public release
readiness. The test does not change existing calculator notification actions;
activation is a separate reviewed environment change.

If the run fails, inspect the sanitized result and cleanup step before retrying.
If the runner is forcibly stopped, cleanup cannot be guaranteed. Infrastructure
support should inspect/delete only that run's temporary test alarm (whose name is
derived from the workflow run ID and attempt), using approved AWS access. Do not
rerun just to remove an older alarm: a new attempt has a different name and scope.
A test that produced only one email remains incomplete even if cleanup succeeded.

## Change or pause the route

Keep the chosen parameter stable unless the address needs to change. When it
changes, review a new plan/apply and expect subscription replacement and a new
confirmation; do not assume AWS notices a private value change without an apply.
To remove this email route, set its parameter-name input back to null and apply.
That removes only the new private subscription, not the shared SNS topic or
existing subscribers. To pause calculator-specific notifications independently,
set their actions flag false and apply; generic alarms and other subscriptions
retain their existing behavior.

Retain the private parameter until any dependent configuration has been removed.
No usage-record cleanup job is involved; temporary document cleanup and operational
log retention remain separate concerns.
