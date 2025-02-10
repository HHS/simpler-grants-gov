#!/bin/bash

# -----------------------------------------------------------------------------
# Starts a step function execution for the given application and environment.
#
# Positional parameters:
#   APP – the name of subdirectory of /infra that holds the application's code
#   ENVIRONMENT (required) – the name of the application environment (e.g. dev, staging, prod)
#   STEP_FUNCTION (required) – the name of the step function to execute
#
# -----------------------------------------------------------------------------

set -euo pipefail

APP="$1"
ENVIRONMENT="$2"
STEP_FUNCTION="$3"

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region)
USER=$(whoami)
DATE=$(date +%s)
STEP_FUNCTION_ARN="arn:aws:states:$REGION:$ACCOUNT:stateMachine:$APP-$ENVIRONMENT-$STEP_FUNCTION"
EXECUTION_ARN="arn:aws:states:$REGION:$ACCOUNT:execution:$APP-$ENVIRONMENT-$STEP_FUNCTION"
EXECUTION_URL="https://$REGION.console.aws.amazon.com/states/home?region=$REGION#/v2/executions/details/$EXECUTION_ARN:$USER-$DATE"

echo "aws stepfunctions start-execution"
echo "  --state-machine-arn $STEP_FUNCTION_ARN"
echo "  --name $USER-$DATE"

aws stepfunctions start-execution \
  --state-machine-arn "$STEP_FUNCTION_ARN" \
  --name "$USER-$DATE" \
  >/dev/null 2>&1

echo ""
echo "View the step function execution in the AWS console:"
echo "  $EXECUTION_URL"
