#!/bin/bash
# Prints a JSON dictionary that maps account names to account ids for the list
# of accounts given by the terraform backend files of the form
# <ACCOUNT_NAME>.<ACCOUNT_ID>.s3.tfbackend in the infra/accounts directory.
set -euo pipefail

# We use script dir to make this script agnostic to where it's called from.
# This is needed since this script its called from infra/<app>/build-repository
# in an external data source
script_dir=$(dirname "$0")

key_value_pairs=()
backend_config_file_paths=$(ls -1 "$script_dir"/../infra/accounts/*.*.s3.tfbackend)

for backend_config_file_path in $backend_config_file_paths; do
  backend_config_file=$(basename "$backend_config_file_path")
  backend_config_name="${backend_config_file/.s3.tfbackend/}"
  IFS='.' read -r account_name account_id <<< "$backend_config_name"
  key_value_pairs+=("\"$account_name\":\"$account_id\"")
done

IFS=","
echo "{${key_value_pairs[*]}}"
