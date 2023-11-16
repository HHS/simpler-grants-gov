#!/bin/bash
# -----------------------------------------------------------------------------
# Script that invokes the database role-manager AWS Lambda function to create
# or update the Postgres user roles for a particular environment.
# The Lambda function is created by the infra/app/database root module and is
# defined in the infra/app/database child module.
#
# Positional parameters:
#   APP_NAME (required) – the name of subdirectory of /infra that holds the
#     application's infrastructure code.
#   ENVIRONMENT (required) - the name of the application environment (e.g. dev
#     staging, prod)
# -----------------------------------------------------------------------------
set -euo pipefail

APP_NAME=$1
ENVIRONMENT=$2

./bin/terraform-init.sh "infra/$APP_NAME/database" "$ENVIRONMENT"
DB_ROLE_MANAGER_FUNCTION_NAME=$(terraform -chdir="infra/$APP_NAME/database" output -raw role_manager_function_name)

echo "================================"
echo "Creating/updating database users"
echo "================================"
echo "Input parameters"
echo "  APP_NAME=$APP_NAME"
echo "  ENVIRONMENT=$ENVIRONMENT"
echo
echo "Invoking Lambda function: $DB_ROLE_MANAGER_FUNCTION_NAME"
CLI_RESPONSE=$(aws lambda invoke \
  --function-name "$DB_ROLE_MANAGER_FUNCTION_NAME" \
  --no-cli-pager \
  --log-type Tail \
  --output json \
  response.json)

# Print logs out (they are returned base64 encoded)
echo "$CLI_RESPONSE" | jq -r '.LogResult' | base64 --decode
echo
echo "Lambda function response:"
cat response.json
rm response.json

# Exit with nonzero status if function failed
FUNCTION_ERROR=$(echo "$CLI_RESPONSE" | jq -r '.FunctionError')
if [ "$FUNCTION_ERROR" != "null" ]; then
  exit 1
fi
