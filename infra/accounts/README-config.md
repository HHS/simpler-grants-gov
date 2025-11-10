# AWS Config Security Hub Compliance Fix

## Problem
AWS Security Hub reports Config.1 compliance issues:
- `CONFIG_RECORDER_MISSING_REQUIRED_RESOURCE_TYPES`: Missing IAM resource recording
- `CONFIG_RECORDER_CUSTOM_ROLE`: Using custom role instead of service-linked role

## Solution
The AWS Config recorder has been updated to use the AWS Config service-linked role and enabled global resource recording. It is now managed outside of Terraform to avoid conflicts with the NewRelic module.

## What Was Changed
- **Role**: Changed from `newrelic_configuration_recorder-simpler-grants-gov` custom role to `AWSServiceRoleForConfig` service-linked role
- **Global Resources**: Enabled `includeGlobalResourceTypes` to record IAM resources (User, Policy, Group, Role)
- **Management**: Removed from Terraform state - the recorder is now managed outside of Terraform

## Known Behavior
Terraform plans will show `Plan: 1 to add` for `module.newrelic-aws-cloud-integrations.aws_config_configuration_recorder.newrelic_recorder`. This is expected and should **not** be applied, as it would create a non-compliant recorder configuration.

## Verification
Verify the recorder configuration with:
```bash
aws configservice describe-configuration-recorders --region us-east-1
```

Check for:
- `roleARN` ending in `/AWSServiceRoleForConfig`
- `includeGlobalResourceTypes: true`
