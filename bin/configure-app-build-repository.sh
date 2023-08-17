#!/bin/bash
# -----------------------------------------------------------------------------
# This script configures the build-repository module for the specified application.
# It creates a shared.tfvars file and shared.s3.tfbackend in the module directory.
# The configuration will be shared across all of the application's environments.
#
# Positional parameters:
#   APP_NAME (required) – the name of subdirectory of /infra that holds the
#     application's infrastructure code.
# -----------------------------------------------------------------------------
set -euo pipefail


APP_NAME=$1

#--------------------------------------
# Create terraform backend config file
#--------------------------------------

MODULE_DIR="infra/$APP_NAME/build-repository"
BACKEND_CONFIG_NAME="shared"

./bin/create-tfbackend.sh $MODULE_DIR $BACKEND_CONFIG_NAME

#--------------------
# Create tfvars file
#--------------------

TF_VARS_FILE="$MODULE_DIR/terraform.tfvars"
REGION=$(terraform -chdir=infra/accounts output -raw region)

echo "==========================================="
echo "Setting up tfvars file for build-repository"
echo "==========================================="
echo "Input parameters"
echo "  APP_NAME=$APP_NAME"
echo

# Create output file from example file
cp $MODULE_DIR/example.tfvars $TF_VARS_FILE

# Replace the placeholder values
sed -i.bak "s/<REGION>/$REGION/g" $TF_VARS_FILE

# Remove the backup file created by sed
rm $TF_VARS_FILE.bak

echo "Created file: $TF_VARS_FILE"
echo "------------------ file contents ------------------"
cat $TF_VARS_FILE
echo "----------------------- end -----------------------"
