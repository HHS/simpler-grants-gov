# AWS Config Security Hub Compliance Fix

## Problem
AWS Security Hub reports Config.1 compliance issues:
- `CONFIG_RECORDER_MISSING_REQUIRED_RESOURCE_TYPES`: Missing IAM resource recording
- `CONFIG_RECORDER_CUSTOM_ROLE`: Using custom role instead of service-linked role

## Solution
The AWS Config recorder needs to be transferred from NewRelic module management to direct Terraform management with updated settings.

## One-Time Setup Steps

Run these commands in `infra/accounts/`:

```bash
# 1. Remove the recorder from NewRelic module state
terraform state rm module.newrelic-aws-cloud-integrations.aws_config_configuration_recorder.newrelic_recorder

# 2. Import the existing recorder into our new resource
terraform import aws_config_configuration_recorder.main newrelic_configuration_recorder-simpler-grants-gov

# 3. Plan and verify changes
terraform plan

# 4. Apply the updated configuration
terraform apply
```

## What Changes
- **Role**: Changes from `newrelic_configuration_recorder-simpler-grants-gov` custom role to `AWSServiceRoleForConfig` service-linked role
- **Global Resources**: Enables `includeGlobalResourceTypes` to record IAM resources (User, Policy, Group, Role)

## Verification
After applying, verify with:
```bash
aws configservice describe-configuration-recorders --region us-east-1
```

Check for:
- `roleARN` ending in `/AWSServiceRoleForConfig`
- `includeGlobalResourceTypes: true`
