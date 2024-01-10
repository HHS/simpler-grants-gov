#!/bin/bash
# Prints a JSON dictionary that maps account names to account ids for the list
# of accounts given by the terraform backend files of the form
# <ACCOUNT_NAME>.<ACCOUNT_ID>.s3.tfbackend in the infra/accounts directory.
set -euo pipefail


# We use script dir to make this script agnostic to where it's called from.
# This is needed since this script its called from infra/<app>/build-repository
# in an external data source
SCRIPT_DIR=$(dirname "$0")

KEY_VALUE_PAIRS=()
BACKEND_CONFIG_FILE_PATHS=$(ls -1 "$SCRIPT_DIR"/../infra/accounts/*.*.s3.tfbackend)

for BACKEND_CONFIG_FILE_PATH in $BACKEND_CONFIG_FILE_PATHS; do 
  BACKEND_CONFIG_FILE=$(basename "$BACKEND_CONFIG_FILE_PATH")
  BACKEND_CONFIG_NAME="${BACKEND_CONFIG_FILE/.s3.tfbackend/}"
  IFS='.' read -r ACCOUNT_NAME ACCOUNT_ID <<< "$BACKEND_CONFIG_NAME"
  KEY_VALUE_PAIRS+=("\"$ACCOUNT_NAME\":\"$ACCOUNT_ID\"")
done

IFS=","
echo "{${KEY_VALUE_PAIRS[*]}}"
