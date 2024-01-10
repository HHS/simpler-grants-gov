#!/bin/bash
# -----------------------------------------------------------------------------
# This script creates SSM parameter for storing integration URL for incident management
# services. Script creates new SSM attribute or updates existing. 
#
# Positional parameters:
#   APP_NAME (required) – the name of subdirectory of /infra that holds the
#     application's infrastructure code.
#   ENVIRONMENT is the name of the application environment (e.g. dev, staging, prod)
#   INTEGRATION_ENDPOINT_URL is the url for the integration endpoint for external 
#   incident management services (e.g. Pagerduty, Splunk-On-Call)
# -----------------------------------------------------------------------------
set -euo pipefail

APP_NAME=$1
ENVIRONMENT=$2
INTEGRATION_ENDPOINT_URL=$3

terraform -chdir="infra/$APP_NAME/app-config" init > /dev/null
terraform -chdir="infra/$APP_NAME/app-config" apply -refresh-only -auto-approve> /dev/null

HAS_INCIDENT_MANAGEMENT_SERVICE=$(terraform -chdir="infra/$APP_NAME/app-config" output -raw has_incident_management_service)
if [ "$HAS_INCIDENT_MANAGEMENT_SERVICE" = "false" ]; then
  echo "Application does not have incident management service, no secret to create"
  exit 0
fi

SECRET_NAME=$(terraform -chdir="infra/$APP_NAME/app-config" output -json environment_configs | jq -r ".$ENVIRONMENT.incident_management_service_integration.integration_url_param_name")

echo "====================="
echo "Setting up SSM secret"
echo "====================="
echo "APPLICATION_NAME=$APP_NAME"
echo "ENVIRONMENT=$ENVIRONMENT"
echo "INTEGRATION_URL=$INTEGRATION_ENDPOINT_URL" 
echo
echo "Creating SSM secret: $SECRET_NAME"

aws ssm put-parameter \
    --name "$SECRET_NAME" \
    --value "$INTEGRATION_ENDPOINT_URL" \
    --type SecureString \
    --overwrite

