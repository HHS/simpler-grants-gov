# Set up monitoring notifications

## Overview 

The monitoring module defines metric-based alerting policies that provides awareness into issues with the cloud application. The module supports integration with external incident management tools like Splunk-On-Call or Pagerduty. It also supports email alerts.

### Set up email alerts.

1. Add the `email_alerts_subscription_list` variable to the monitoring module call in the service layer

For example:
```
module "monitoring" {
  source = "../../modules/monitoring"
  email_alerts_subscription_list = ["email1@email.com", "email2@email.com"]
  ...
}
```
2. Run `make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>` to apply the changes to each environment.
When any of the alerts described by the module are triggered notification will be send to all email specified in the `email_alerts_subscription_list`

### Set up External incident management service integration.

1. Set setting `has_incident_management_service = true` in app-config/main.tf
2. Get the integration URL for the incident management service and store it in AWS SSM Parameter Store by running the following command for each environment:
```
make infra-configure-monitoring-secrets APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT> URL=<WEBHOOK_URL>
```
3. Run `make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>` to apply the changes to each environment.
