# Create the private infra-dev alert email parameter

Work for [#12568](https://github.com/HHS/simpler-grants-gov/issues/12568).
This is the parameter-creation step for the private routing support in
[PR #12959](https://github.com/HHS/simpler-grants-gov/pull/12959).
The workflow can be reviewed and merged independently of that PR; deploying
the private route requires its support and a successfully created parameter.

## What this workflow does

**Set up private NOFO alert email** is a manual, main-branch-only workflow in
the upstream HHS repository. It uses the existing GitHub AWS identity for the
fixed infra-dev account, with a restrictive session policy permitting only:

- Creating `/nofos/infra-dev/monitoring/alert-email` in `us-east-1`.
- KMS encryption through Parameter Store for that exact parameter context.

It writes a Standard SecureString using the account's AWS-managed `alias/aws/ssm`
key. It cannot overwrite an existing parameter, read/decrypt values, create an
email subscription, publish a notification, change WAF, enable alarms or deploy
the application. It does not change the underlying deployment role's IAM policy;
session permissions only narrow permissions that the role already has.

The workflow has no recipient, parameter-path, account or environment input.
It accepts the private address only from the Actions repository secret
`NOFO_INFRA_DEV_ALERT_EMAIL`. The script passes it to AWS over standard input,
not command arguments or a temporary file, and suppresses raw AWS responses and
errors. No artifact contains the value. The address must not be copied into
public comments, screenshots, dispatch inputs, code or workflow logs.

The default AWS-managed key is shared across Parameter Store in this account;
this is not a dedicated-key isolation boundary. The later routing deployment
must be able to read/decrypt the parameter. Terraform state and SNS will contain
the resolved recipient after routing is deployed and must remain restricted.

## Operator steps after review and merge

1. In the **HHS/simpler-grants-gov** repository, open **Settings → Secrets and
   variables → Actions → New repository secret**. Create
   `NOFO_INFRA_DEV_ALERT_EMAIL` with the privately selected inbox as its value.
   Someone with repository-secret management access must do this; the ability
   to merge PRs or dispatch workflows does not prove that permission.
   If necessary, ask an existing repository administrator to set it privately.
   Do not send the value in a GitHub comment or workflow input.
2. Open **Actions → Set up private NOFO alert email → Run workflow**, select
   **main**, and run it once. This creates an AWS resource; review/merge alone
   does not execute it. No AWS console login is inherently required.
3. Check the result. Success confirms the creation request succeeded; it does
   not demonstrate later deployment read/decrypt permission or email delivery.
   If the secret is missing/invalid, validation stops before AWS authentication.
4. If AWS denies authentication, parameter creation or encryption, give the
   infrastructure maintainer the run link, operation and fixed parameter path.
   Ask them to check the existing role/trust policy, permissions boundary,
   organization policy and KMS access as applicable. Do not broaden access in
   this workflow or publish raw audit logs. An existing AWS operator can create
   the same SecureString privately instead if that is the approved access path.
5. If the parameter already exists, the workflow fails without reading or
   changing it. Have the operator confirm its type, encryption and intended
   recipient privately. Do not delete or overwrite it merely to obtain a green
   run. A timeout leaves creation status uncertain; inspect privately first.
6. Once routing support is merged, prepare a separate environment opt-in setting
   `monitoring_email_alert_recipient_parameter_name` to this fixed path and keep
   `pdf_readability_alarm_actions_enabled = false`. Review/apply using the usual
   deployment process. Parameter creation must precede that plan/apply.
7. Someone with inbox access accepts the SNS confirmation email. Then conduct
   a controlled delivery check before explicitly enabling calculator alarms.
   The shared topic may already route generic Builder alerts after subscription.

The GitHub secret is a setup input, not an automatically synchronized source.
Updating it does not update AWS. After successful setup, an administrator can
remove it when no longer needed; existing routing will continue reading SSM.
Recipient changes or parameter deletion require a separate reviewed operation,
with existing routing dependencies checked first. Production setup is outside
this workflow's scope. Slack/New Relic remains follow-on work in
[#12950](https://github.com/HHS/simpler-grants-gov/issues/12950).

## Offline validation

```sh
python3 -m unittest discover -s scripts/tests -p test_nofo_alert_setup.py -v
```

Tests mock the AWS process, including sensitive failure output, existing
parameters, access denial and timeout. CI does not authenticate to AWS or read
the private secret. These checks do not prove effective deployed permissions.

AWS references: [PutParameter API](https://docs.aws.amazon.com/systems-manager/latest/APIReference/API_PutParameter.html),
[overwrite permission condition](https://docs.aws.amazon.com/systems-manager/latest/userguide/parameter-store-policy-conditions.html),
and [SecureString encryption context](https://docs.aws.amazon.com/systems-manager/latest/userguide/secure-string-parameter-kms-encryption.html).
