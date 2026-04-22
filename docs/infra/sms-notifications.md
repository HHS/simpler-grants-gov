# SMS Notifications

The application can send SMS notifications to users using AWS End User Messaging (SMS) service. This document describes how to configure SMS notifications including phone number registration in AWS, infrastructure setup, and testing procedures.

## Requirements

1. **AWS End User Messaging SMS Registration**: An AWS End User Messaging SMS registration form must be completed, submitted, and approved by AWS prior to requesting an originator phone number. This approved registration is required to request an originator phone number.
2. **Approval Timeline**: AWS End User Messaging Registration requests takes 1-15 days depending on region and use case
5. **Verification Setup**: For testing in sandbox environments, destination phone numbers must be verified

## Phone Number Registration Process

### 1. Create AWS End User Messaging Registration

A company or entity must be registered and approved in AWS End User Messaging before using the service for SMS notifications.

**Important Considerations:**
- Registrations and phone numbers are region-specific
    - You must create separate registrations for each AWS region where you plan to send SMS
    - Phone numbers provisioned in one region cannot be used in other regions
- Phone numbers must be provisioned by AWS through the End User Messaging service. You cannot bring existing phone numbers from other carriers or services.

Follow AWS documentation for creating registrations:

- [Creating AWS End User Messaging SMS Registrations](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-create.html)
- [Registration Status Reference](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-status.html)

#### Using AWS CLI to Create AWS End User Messaging Registration
You can also choose to use AWS CLI to create the Registration:

#### Registration Types

**Available Registration Types for `--registration-type` parameter:**

To see all available registration types for your region, run:
```bash
aws pinpoint-sms-voice-v2 describe-registration-type-definitions \
  --query 'RegistrationTypeDefinitions[?contains(SupportedAssociations[*].IsoCountryCode, `US`)].RegistrationType' \
  --output table
```

**Common Registration Types:**
- **`COMPANY_LONG_CODE`**: Standard 10-digit phone numbers (e.g., +1-555-123-4567) for business SMS messaging. Suitable for person-to-person messaging and low-to-medium volume SMS sending. Requires AWS approval (1-15 days).
- **`COMPANY_TOLL_FREE`**: Toll-free numbers (e.g., +1-800-555-1234) for business SMS messaging. Requires AWS approval (1-15 days).
- **`COMPANY_10DLC`**: 10-digit long code numbers requiring additional brand and campaign registration for high-volume application-to-person messaging. Requires AWS approval (1-15 days).

**Note**: Use the exact registration type string (e.g., `"COMPANY_LONG_CODE"`) as the value for the `--registration-type` parameter.

**Option 1: Using inline parameters (recommended for simple cases):**
```bash
# Example: Request a long code phone number registration
aws pinpoint-sms-voice-v2 create-registration \
  --registration-type "COMPANY_LONG_CODE" \
  --additional-information '{
    "CompanyName": "Your Company Name",
    "Website": "https://yourwebsite.com",
    "BusinessContactFirstName": "John",
    "BusinessContactLastName": "Doe",
    "BusinessContactEmail": "contact@yourcompany.com",
    "BusinessContactPhone": "+12345678901"
  }'
```

**Option 2: Using a JSON file for complex registrations:**

First, create `registration-details.json`:
```json
{
  "CompanyName": "Your Company Name",
  "Website": "https://yourwebsite.com",
  "BusinessContactFirstName": "John",
  "BusinessContactLastName": "Doe",
  "BusinessContactEmail": "contact@yourcompany.com",
  "BusinessContactPhone": "+12345678901",
  "BusinessAddress": "123 Main St, City, State 12345",
  "SupportEmail": "support@yourcompany.com",
  "SupportPhone": "+12345678902",
  "UseCaseDescription": "Send account notifications and alerts to customers",
  "MonthlyVolume": 1000,
  "OptInProcess": "Users opt-in during account registration with checkbox consent"
}
```

Then run:
```bash
aws pinpoint-sms-voice-v2 create-registration \
  --registration-type "COMPANY_LONG_CODE" \
  --additional-information file://registration-details.json
```

### 2. Monitor Registration Status

Track your registration status until approved:

```bash
# Check registration status
aws pinpoint-sms-voice-v2 describe-registrations \
  --registration-ids "your-registration-id"
```

Registration must be in **APPROVED** or **COMPLETE** status before linking to infrastructure.

### 3. Phone Number Types

**All phone numbers are:**
- **Region-specific**: Numbers can only be used within the AWS region where they were provisioned
- **AWS-provisioned only**: You cannot bring existing numbers from other carriers or services

**Available number types:**
- **LONG_CODE**: Standard 10-digit phone numbers for low-volume messaging
- **TOLL_FREE**: Toll-free numbers (800, 888, etc.) for higher volume
- **TEN_DLC**: 10-digit long codes for business messaging (US only)
- **SIMULATOR**: Test numbers for development (immediate approval, limited recipients)

### Simulator Phone Numbers
AWS Allows to use **simulator** phone numbers as originator to send text. This simulator phone numbers are only allowed to send SMS text to:
- `+14254147755` → Simulates successful delivery (`TEXT_SUCCESS`)
- `+14254147167` → Simulates carrier block/failure (`TEXT_BLOCKED`)

## Infrastructure Configuration

### 1. Enable SMS notifications in application config

Update `enable_sms_notifications = true` in your application's `app-config` module:

**File: `infra/<APP_NAME>/app-config/main.tf`**
```terraform
locals {
  # Enable email notifications
  enable_notifications     = true
  # Enable SMS notifications
  enable_sms_notifications = true
}
```

### 2. Configure SMS settings

Configure SMS settings in your environment config:

**File: `infra/<APP_NAME>/app-config/env-config/dev.tf`** (example)
```terraform
module "dev_config" {
  source = "./env-config"

  # ... other configuration

  # SMS Configuration
  enable_sms_notifications = local.enable_sms_notifications
  sms_sender_phone_number_registration_id = null  # Enter AWS End User SMS Registration ID when available; otherwise leave empty to use simulator phone number for dev
  sms_number_type                        = null # Enter SMS Number Type (e.g: 'SHORT_CODE', 'LONG_CODE', 'TOLL_FREE', 'TEN_DLC', 'SIMULATOR') when available; otherwise leave empty to use simulator number type
}
```
*__Note:__* if an AWS End User SMS Registration ID is not provided, a simulator phone number will be automatically provisioned.

### 3. Deploy SMS notification infrastructure

```bash
make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

This creates:
- SMS configuration set
- Phone pool - it will reuse existing phone number pool in temporary environments
- CloudWatch log groups for delivery tracking
- IAM policies with least-privilege access
- VPC endpoint for SMS service access

## Application Integration

### Environment Variables

The infrastructure automatically provides these environment variables to your application:

- `AWS_SMS_CONFIGURATION_SET_NAME`: Configuration set for delivery tracking
- `AWS_SMS_PHONE_POOL_ARN`: Phone pool ARN for message sending
- `AWS_SMS_PHONE_POOL_ID`: Phone pool ID for message sending

### Example Application Code

```python
import boto3
import os

def send_sms_notification(phone_number, message):
    client = boto3.client('pinpoint-sms-voice-v2')

    response = client.send_text_message(
        DestinationPhoneNumber=phone_number,
        Message=message,
        ConfigurationSetName=os.environ['AWS_SMS_CONFIGURATION_SET_NAME'],
        PoolId=os.environ['AWS_SMS_PHONE_POOL_ID'],
    )

    return response['MessageId']
```


## Testing Setup

*__Note:__* This assumes your AWS End User Messaging SMS Registration has been approved and configured in `infra/<APP_NAME>/app-config/env-config/dev.tf|staging.tf|prod.tf`

### 1. Verify Destination Numbers (Sandbox Accounts)

In sandbox environments, you can only send SMS to up to 10 verified phone numbers. Steps to register destination phone numbers:

```bash
# 1. Register the destination phone number
aws pinpoint-sms-voice-v2 create-verified-destination-number \
  --destination-phone-number "+1234567890"

# Note the VerifiedDestinationNumberId from the response

# 2. Send verification code
aws pinpoint-sms-voice-v2 send-destination-number-verification-code \
  --verified-destination-number-id "your-verified-id" \
  --verification-channel TEXT

# 3. Complete verification with received code
aws pinpoint-sms-voice-v2 verify-destination-number \
  --verified-destination-number-id "your-verified-id" \
  --verification-code "123456"
```

### 2. Test SMS Delivery

Get SMS configuration from your deployed environment:

```bash
# Initialize Terraform and get SMS pool ID
bin/terraform-init "infra/<APP_NAME>/service" "<ENVIRONMENT>"
SERVICE_NAME=$(terraform -chdir=infra/app/service output --json | jq -r '.service_name.value')
CONFIG_SET=$SERVICE_NAME-sms-config-set
SMS_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name $CONFIG_SET \
  --query 'Stacks[0].Outputs[?OutputKey==`PhonePoolId`].OutputValue' \
  --output text)
```

Command to send a test SMS:

```bash
aws pinpoint-sms-voice-v2 send-text-message \
  --destination-phone-number "+14254147755" \
  --message-body "Test SMS from your application" \
  --origination-identity "$SMS_POOL_ID" \
  --configuration-set-name "$CONFIG_SET"
```

Verifying Text Sent Logs
```bash
aws logs filter-log-events  \
 --log-group-name "/aws/sms-voice/$SERVICE_NAME-sms/sms-notifications/delivery-receipts"  \
 --start-time $(date -v-30M +%s)000 \
 --query 'events[*].{Time:timestamp,Message:message}' \
 --output table
```

### 3. Testing Scenarios

Test these scenarios to validate your SMS setup:

**Successful Delivery:**
```bash
# Send to verified number
aws pinpoint-sms-voice-v2 send-text-message \
  --destination-phone-number "+1234567890" \
  --message "Hello! This is a test message." \
  --pool-id "$SMS_POOL_ID" \
  --configuration-set-name "$CONFIG_SET"
```

**Opt-out Testing:**
1. Send SMS to verified number
2. Reply "STOP" to the message
3. Attempt to send another message (should be blocked)

**Invalid Number Testing:**
```bash
# Send to invalid number format
aws pinpoint-sms-voice-v2 send-text-message \
  --destination-phone-number "+1000000000" \
  --message "This should fail" \
  --pool-id "$SMS_POOL_ID" \
  --configuration-set-name "$CONFIG_SET"
```

## Monitoring and Logging

### CloudWatch Logs

SMS delivery events are logged to CloudWatch under log group `/aws/sms-voice/<APP_NAME>-sms/sms-notifications/delivery-receipts`.

Event types logged:
- `TEXT_QUEUED`: Message accepted by carrier
- `TEXT_DELIVERED`: Message delivered to device
- `TEXT_BLOCKED`: Message blocked by carrier or recipient
- `TEXT_FAILURE`: Delivery failure
- `TEXT_UNREACHABLE`: Phone number unreachable

### Delivery Status Monitoring

```bash
# View recent SMS delivery logs
aws logs filter-log-events \
  --log-group-name "/aws/sms-voice/<APP_NAME>-sms/sms-notifications/delivery-receipts" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "TEXT_DELIVERED"
```

## AWS Best Practices

Following [AWS End User Messaging SMS Best Practices](https://docs.aws.amazon.com/sms-voice/latest/userguide/best-practices.html):

## Troubleshooting

### Common Issues

**Phone number not approved:**
- Check registration status: `aws pinpoint-sms-voice-v2 describe-registrations`
- Ensure registration is in APPROVED or COMPLETE status
- Contact AWS support if registration is stuck

**Delivery failures:**
- Check CloudWatch logs for specific error codes
- Verify destination number is properly formatted (+1XXXXXXXXXX)
- Check if recipient has opted out

### Support Resources

- [AWS End User Messaging SMS Developer Guide](https://docs.aws.amazon.com/sms-voice/latest/)
- [Phone Number Registration Troubleshooting](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-troubleshoot.html)
- [SMS Delivery Best Practices](https://docs.aws.amazon.com/sms-voice/latest/userguide/best-practices.html)

## Cost Considerations

SMS messaging incurs costs based on:
- Message volume and destination country
- Phone number monthly fees