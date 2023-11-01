#!/bin/bash
# -----------------------------------------------------------------------------
# This script creates a terraform backend config file for a terraform module.
# It is not meant to be used directly. Instead, it is called by other scripts
# that set up and configure the infra/accounts module and the infra/app/ modules
# such as infra/app/build-repository and infra/app/service
#
# Positional parameters:
#   MODULE_DIR (required) - the directory of the root module that will be configured
#   BACKEND_CONFIG_NAME (required) - the name of the backend that will be created.
#     For environment specific configs, the BACKEND_CONFIG_NAME will be the same
#     as ENVIRONMENT. For shared configs, the BACKEND_CONFIG_NAME will be "shared".
#   TF_STATE_KEY (optional) - the S3 object key of the tfstate file in the S3 bucket
#     Defaults to [MODULE_DIR]/[BACKEND_CONFIG_NAME].tfstate
# -----------------------------------------------------------------------------
set -euo pipefail

MODULE_DIR=$1
BACKEND_CONFIG_NAME=$2
TF_STATE_KEY="${3:-$MODULE_DIR/$BACKEND_CONFIG_NAME.tfstate}"

# The local tfbackend config file that will store the terraform backend config
BACKEND_CONFIG_FILE="$MODULE_DIR/$BACKEND_CONFIG_NAME.s3.tfbackend"

# Get the name of the S3 bucket that was created to store the tf state
# and the name of the DynamoDB table that was created for tf state locks.
# This will be used to configure the S3 backends in all the application
# modules
TF_STATE_BUCKET_NAME=$(terraform -chdir=infra/accounts output -raw tf_state_bucket_name)
TF_LOCKS_TABLE_NAME=$(terraform -chdir=infra/accounts output -raw tf_locks_table_name)
REGION=$(terraform -chdir=infra/accounts output -raw region)

echo "===================================="
echo "Create terraform backend config file"
echo "===================================="
echo "Input parameters"
echo "  MODULE_DIR=$MODULE_DIR"
echo "  BACKEND_CONFIG_NAME=$BACKEND_CONFIG_NAME"
echo

# Create output file from example file
cp infra/example.s3.tfbackend "$BACKEND_CONFIG_FILE"

# Replace the placeholder values
sed -i.bak "s/<TF_STATE_BUCKET_NAME>/$TF_STATE_BUCKET_NAME/g" "$BACKEND_CONFIG_FILE"
sed -i.bak "s|<TF_STATE_KEY>|$TF_STATE_KEY|g" "$BACKEND_CONFIG_FILE"
sed -i.bak "s/<TF_LOCKS_TABLE_NAME>/$TF_LOCKS_TABLE_NAME/g" "$BACKEND_CONFIG_FILE"
sed -i.bak "s/<REGION>/$REGION/g" "$BACKEND_CONFIG_FILE"

# Remove the backup file created by sed
rm "$BACKEND_CONFIG_FILE.bak"


echo "Created file: $BACKEND_CONFIG_FILE"
echo "------------------ file contents ------------------"
cat "$BACKEND_CONFIG_FILE"
echo "----------------------- end -----------------------"
