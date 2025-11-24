# Security Hub Alerts Setup

This configuration sets up automated alerts for AWS Security Hub findings.

## What's Configured

### 1. SNS Topic
- **Topic Name**: `security-hub-findings`
- **Purpose**: Central notification hub for Security Hub findings
- **Default Subscription**: Email to `grantsalerts@navapbc.com`

### 2. EventBridge Rules
Two EventBridge rules capture Security Hub findings:

#### Critical Severity Findings
- **Rule**: `security-hub-critical-findings`
- **Triggers on**: CRITICAL severity findings with NEW workflow status
- **Notification**: 🚨 CRITICAL Security Finding

#### High Severity Findings
- **Rule**: `security-hub-high-findings`
- **Triggers on**: HIGH severity findings with NEW workflow status
- **Notification**: ⚠️ HIGH Security Finding

### 3. Alert Format
Each alert includes:
- Finding title and severity
- Compliance status
- Description
- Affected resource details
- AWS account and region
- Remediation recommendations
- Direct link to AWS Security Hub console

## Email Notifications

Email notifications are automatically sent to `grantsalerts@navapbc.com` when CRITICAL or HIGH severity findings are detected.

**Note**: The first email sent to this address will require confirmation via AWS SNS subscription confirmation email.

## Slack Integration (Optional)

To enable Slack notifications via webhook:

### 1. Create a Slack Webhook

1. Go to your Slack workspace settings
2. Navigate to **Apps** > **Incoming Webhooks**
3. Create a new webhook for your desired channel
4. Copy the webhook URL (e.g., `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`)

### 2. Store Webhook in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name security-hub-slack-webhook \
  --secret-string '{"webhook_url":"https://hooks.slack.com/services/YOUR/WEBHOOK/URL"}' \
  --region us-east-1
```

### 3. Enable in Terraform

Uncomment the Slack integration resources in `infra/accounts/security_hub_alerts.tf`:

- `data.aws_secretsmanager_secret.slack_webhook`
- `data.aws_secretsmanager_secret_version.slack_webhook`
- `aws_iam_role.security_hub_slack_lambda`
- `aws_iam_role_policy_attachment.lambda_basic`
- `aws_iam_role_policy.lambda_secrets`
- `aws_lambda_function.security_hub_slack`
- `aws_lambda_permission.allow_sns`
- `aws_sns_topic_subscription.security_hub_findings_slack`

### 4. Apply Terraform

```bash
cd infra/accounts
terraform init
terraform plan
terraform apply
```

The Lambda function will automatically format Security Hub findings as rich Slack messages with:
- Color-coded severity (🚨 Red for CRITICAL, ⚠️ Orange for HIGH)
- Formatted finding details
- Direct links to AWS console

## Testing the Alerts

To test the alert system:

1. **Trigger a test finding** in AWS Security Hub:
   ```bash
   aws securityhub batch-import-findings \
     --findings '[{
       "SchemaVersion": "2018-10-08",
       "Id": "test-finding-1",
       "ProductArn": "arn:aws:securityhub:us-east-1:123456789012:product/123456789012/default",
       "GeneratorId": "test-generator",
       "AwsAccountId": "123456789012",
       "Types": ["Software and Configuration Checks/AWS Security Best Practices"],
       "CreatedAt": "2025-01-01T00:00:00.000Z",
       "UpdatedAt": "2025-01-01T00:00:00.000Z",
       "Severity": {"Label": "CRITICAL"},
       "Title": "Test Critical Finding",
       "Description": "This is a test finding to verify alert configuration",
       "Resources": [{
         "Type": "Other",
         "Id": "test-resource"
       }],
       "WorkflowState": "NEW",
       "Workflow": {"Status": "NEW"},
       "RecordState": "ACTIVE"
     }]'
   ```

2. **Check your email** at `grantsalerts@navapbc.com`
3. **Archive the test finding** in Security Hub console to clean up

## Customization

### Adjusting Severity Levels

To receive alerts for MEDIUM severity findings, add another EventBridge rule in `security_hub_alerts.tf`:

```hcl
resource "aws_cloudwatch_event_rule" "security_hub_medium_findings" {
  name        = "security-hub-medium-findings"
  description = "Capture MEDIUM severity findings from Security Hub"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["MEDIUM"]
        }
        Workflow = {
          Status = ["NEW"]
        }
        RecordState = ["ACTIVE"]
      }
    }
  })
}
```

### Adding Additional Filters

You can filter by specific compliance standards, resource types, or control IDs by modifying the `event_pattern` in the EventBridge rules.

Example - Only alert on failed CIS controls:
```hcl
event_pattern = jsonencode({
  source      = ["aws.securityhub"]
  detail-type = ["Security Hub Findings - Imported"]
  detail = {
    findings = {
      Severity = {
        Label = ["CRITICAL", "HIGH"]
      }
      GeneratorId = [{
        prefix = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark"
      }]
      Compliance = {
        Status = ["FAILED"]
      }
    }
  }
})
```

## Monitoring

- **SNS Topic Metrics**: View in CloudWatch under SNS metrics
- **EventBridge Rule Metrics**: View in CloudWatch under Events metrics
- **Security Hub Findings**: View in AWS Security Hub console

## Troubleshooting

### Not receiving emails?
1. Check SNS subscription is confirmed (check spam folder for confirmation email)
2. Verify EventBridge rules are enabled
3. Check CloudWatch Logs for EventBridge rule invocations

### Too many alerts?
1. Consider adjusting severity levels (remove HIGH, keep only CRITICAL)
2. Add filters for specific compliance standards
3. Suppress findings for known issues using Security Hub suppression rules

### Testing with real findings?
Use the Security Hub Insights created in `security_hub.tf` to view current findings before enabling alerts.

## Resources

- [AWS Security Hub EventBridge Integration](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-cloudwatch-events.html)
- [Security Hub Finding Format](https://docs.aws.amazon.com/securityhub/latest/userguide/securityhub-findings-format.html)
- [EventBridge Event Patterns](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-event-patterns.html)
