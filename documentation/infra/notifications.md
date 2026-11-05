# Notifications

The application may need to send email notifications to users. This document describes how to configure notifications. The notification setup process will:

1. Configure an Amazon SES (Simple Email Service) email identity for the domain
2. Grant the application service permission to send email through SES
3. Set the `AWS_SES_FROM_EMAIL` environment variable on the application service

## Requirements

Before setting up notifications you'll need to have [set up custom domains](/docs/infra/custom-domains.md) since notifications require a domain for the sender email address.

## 1. Enable notifications in application config

Update `enable_notifications = true` in your application's `app-config` module (`infra/<APP_NAME>/app-config/main.tf`).

## 2. Configure notification settings

The notification configuration is defined in the environment config module in `infra/<APP_NAME>/app-config/env-config/notifications.tf`. You can customize the following settings:

- `sender_display_name`: The name that appears in email clients (optional)
- `sender_email`: The email address used to send notifications (defaults to notifications@<domain_name>)
- `reply_to_email`: A different reply-to address if needed (defaults to sender_email)

## 3. Deploy the notification service

Run the following command:

```bash
make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

## 4. Send a test email

To send a test email using the AWS CLI, run the following command, replacing `<SENDER_EMAIL>` with the environment's sender address (the service's `AWS_SES_FROM_EMAIL`, e.g. `notifications@<domain_name>`) and `<RECIPIENT_EMAIL>` with the address you want to send to:

```bash
aws sesv2 send-email \
  --from-email-address "<SENDER_EMAIL>" \
  --destination '{"ToAddresses": ["<RECIPIENT_EMAIL>"]}' \
  --content '{
    "Simple": {
      "Subject": { "Data": "Test notification", "Charset": "UTF-8" },
      "Body": {
        "Text": { "Data": "This is a message from the future", "Charset": "UTF-8" },
        "Html": { "Data": "This is a message from the future", "Charset": "UTF-8" }
      }
    }
  }'
```
