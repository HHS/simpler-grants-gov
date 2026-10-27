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
Public recipient lists remain empty, and calculator alarm actions remain off
everywhere. Applying this dev configuration creates the private SNS email
subscription; confirmation and delivery verification are separate steps.

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
