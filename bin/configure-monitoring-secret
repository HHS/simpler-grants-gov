#!/bin/bash
# -----------------------------------------------------------------------------
# This script creates SSM parameter for storing integration URL for incident management
# services. Script creates new SSM attribute or updates existing.
#
# Positional parameters:
#   app_name (required) – the name of subdirectory of /infra that holds the
#     application's infrastructure code.
#   environment is the name of the application environment (e.g. dev, staging, prod)
#   integration_endpoint_url is the url for the integration endpoint for external
#   incident management services (e.g. Pagerduty, Splunk-On-Call)
# -----------------------------------------------------------------------------
set -euo pipefail

app_name=$1
environment=$2
integration_endpoint_url=$3

terraform -chdir="infra/$app_name/app-config" init > /dev/null
terraform -chdir="infra/$app_name/app-config" apply -auto-approve > /dev/null

has_incident_management_service=$(terraform -chdir="infra/$app_name/app-config" output -raw has_incident_management_service)
if [ "$has_incident_management_service" = "false" ]; then
  echo "Application does not have incident management service, no secret to create"
  exit 0
fi

secret_name=$(terraform -chdir="infra/$app_name/app-config" output -json environment_configs | jq -r ".$environment.incident_management_service_integration.integration_url_param_name")

echo "====================="
echo "Setting up SSM secret"
echo "====================="
echo "app_name=$app_name"
echo "environment=$environment"
echo "integration_endpoint_url=$integration_endpoint_url"
echo
echo "Creating SSM secret: $secret_name"

aws ssm put-parameter \
    --name "$secret_name" \
    --value "$integration_endpoint_url" \
    --type SecureString \
    --overwrite
