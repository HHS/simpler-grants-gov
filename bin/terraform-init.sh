#!/bin/bash
# -----------------------------------------------------------------------------
# Convenience script for running terraform init for the specified module and configuration name.
# The configuration name is used to determine which .tfbackend file to use for the -backend-config
# option of terraform init.
#
# Positional parameters:
# MODULE_DIR (required) – The location of the root module to initialize and apply
# CONFIG_NAME (required) – The name of the backend config. For accounts, the config name is the AWS account alias.
#   For application modules the config name is the name of the environment (e.g. "dev", "staging", "prod").
#   For application modules that are shared across environments, the config name is "shared".
#   For example if a backend config file is named "myaccount.s3.tfbackend", then the CONFIG_NAME would be "myaccount"
# -----------------------------------------------------------------------------
set -euo pipefail

MODULE_DIR="$1"
CONFIG_NAME="$2"

# Run terraform init with the named backend config file

BACKEND_CONFIG_FILE="$CONFIG_NAME.s3.tfbackend"

# Note that the BACKEND_CONFIG_FILE path is relative to MODULE_DIR, not the current working directory
terraform -chdir=$MODULE_DIR init \
  -input=false \
  -reconfigure \
  -backend-config=$BACKEND_CONFIG_FILE
