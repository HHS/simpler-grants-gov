#!/bin/bash
# Print the config name for the current AWS account
# Do this by getting the current account and searching for a file in
# infra/accounts that matches "<account name>.<account id>.s3.tfbackend".
# The config name is "<account name>.<account id>""
set -euo pipefail
CURRENT_ACCOUNT_ID=$(./bin/current-account-id.sh)
BACKEND_CONFIG_FILE_PATH=$(ls -1 infra/accounts/*."$CURRENT_ACCOUNT_ID".s3.tfbackend)
BACKEND_CONFIG_FILE=$(basename "$BACKEND_CONFIG_FILE_PATH")
BACKEND_CONFIG_NAME="${BACKEND_CONFIG_FILE/.s3.tfbackend/}"
echo "$BACKEND_CONFIG_NAME"
