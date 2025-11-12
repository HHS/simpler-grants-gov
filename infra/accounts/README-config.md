# AWS Config Security Hub Compliance

## What Was Fixed
The AWS Config recorder `newrelic_configuration_recorder-simpler-grants-gov` was manually updated to meet Security Hub Config.1 requirements:
- **Service-linked role**: Uses `AWSServiceRoleForConfig` instead of custom role
- **Global resource recording**: Enabled to record IAM resources (User, Policy, Group, Role)

## Management Approach
The Config recorder is **not managed by Terraform**. It has been removed from Terraform state to prevent conflicts with the NewRelic module, which would create a non-compliant configuration.

## Expected Behavior
Terraform plans will always show:
```
Plan: 1 to add, 0 to change, 0 to destroy.

# module.newrelic-aws-cloud-integrations.aws_config_configuration_recorder.newrelic_recorder will be created
```

**This is expected and documented.** Do not apply this change - it would create a non-compliant recorder.

When applying other infrastructure changes, use targeted applies:
```bash
terraform apply -target=<specific-resource>
```

## Verification
To verify the recorder remains compliant:
```bash
aws configservice describe-configuration-recorders --region us-east-1
```

Confirm:
- `roleARN` ends with `/AWSServiceRoleForConfig`
- `includeGlobalResourceTypes` is `true`
