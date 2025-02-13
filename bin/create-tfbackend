#!/bin/bash
# -----------------------------------------------------------------------------
# This script creates a terraform backend config file for a terraform module.
# It is not meant to be used directly. Instead, it is called by other scripts
# that set up and configure the infra/accounts module and the infra/app/ modules
# such as infra/app/build-repository and infra/app/service
#
# Positional parameters:
#   module_dir (required) - the directory of the root module that will be configured
#   backend_config_name (required) - the name of the backend that will be created.
#     For environment specific configs, the backend_config_name will be the same
#     as environment. For shared configs, the backend_config_name will be "shared".
#   tf_state_key (optional) - the S3 object key of the tfstate file in the S3 bucket
#     Defaults to [module_dir]/[backend_config_name].tfstate
# -----------------------------------------------------------------------------
set -euo pipefail

module_dir=$1
backend_config_name=$2
tf_state_key="${3:-$module_dir/$backend_config_name.tfstate}"

# The local tfbackend config file that will store the terraform backend config
backend_config_file="$module_dir/$backend_config_name.s3.tfbackend"

# Get the name of the S3 bucket that was created to store the tf state
# and the name of the DynamoDB table that was created for tf state locks.
# This will be used to configure the S3 backends in all the application
# modules
tf_state_bucket_name=$(terraform -chdir=infra/accounts output -raw tf_state_bucket_name)
tf_locks_table_name=$(terraform -chdir=infra/accounts output -raw tf_locks_table_name)
region=$(terraform -chdir=infra/accounts output -raw region)

echo "===================================="
echo "Create terraform backend config file"
echo "===================================="
echo "Input parameters"
echo "  module_dir=$module_dir"
echo "  backend_config_name=$backend_config_name"
echo

# Create output file from example file
cp infra/example.s3.tfbackend "$backend_config_file"

# Replace the placeholder values
sed -i.bak "s/<TF_STATE_BUCKET_NAME>/$tf_state_bucket_name/g" "$backend_config_file"
sed -i.bak "s|<TF_STATE_KEY>|$tf_state_key|g" "$backend_config_file"
sed -i.bak "s/<TF_LOCKS_TABLE_NAME>/$tf_locks_table_name/g" "$backend_config_file"
sed -i.bak "s/<REGION>/$region/g" "$backend_config_file"

# Remove the backup file created by sed
rm "$backend_config_file.bak"

echo "Created file: $backend_config_file"
echo "------------------ file contents ------------------"
cat "$backend_config_file"
echo "----------------------- end -----------------------"
