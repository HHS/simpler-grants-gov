# Set up monitoring notifications

## Overview

The monitoring module defines metric-based alerting policies that provide awareness into issues with the cloud application. The module supports integration with external incident management tools like Splunk-On-Call or Pagerduty. It also supports email alerts.

### Set up email alerts

The monitoring module supports a simple email-based alerting system that does not rely on an external incident management service.

1. Update the `email_alert_recipients` variable in `app-config/env-config/monitoring.tf`

2. Run `make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>` to apply the changes to each environment.

### Integrate with an incident management service

1. Set setting `has_incident_management_service = true` in app-config/main.tf
2. Get the integration URL for the incident management service and store it in AWS SSM Parameter Store by running the following command for each environment:

    ```bash
    make infra-configure-monitoring-secrets APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT> URL=<WEBHOOK_URL>
    ```

3. Run `make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>` to apply the changes to each environment.
