#!/bin/bash
# -----------------------------------------------------------------------------
# Convenience script for running terraform apply for the specified module and configuration name.
# The configuration name is used to determine which .tfvars file to use for the -var-file
# option of terraform apply.
#
# Additional arguments to terraform apply can also be passed in using terraform's built in environment variables
# TF_CLI_ARGS and TF_CLI_ARGS_name. For example, in CI/CD pipelines, you may want to set
# TF_CLI_ARGS="-input=false -auto-approve" to skip the confirmation prompt.
# See https://developer.hashicorp.com/terraform/cli/config/environment-variables#tf_cli_args-and-tf_cli_args_name
#
# Positional parameters:
# MODULE_DIR (required) – The location of the root module to initialize and apply
# CONFIG_NAME (required) – The name of the tfvars config. For accounts, the config name is the AWS account alias.
#   For application modules the config name is the name of the environment (e.g. "dev", "staging", "prod").
#   For application modules that are shared across environments, the config name is "shared".
#   For example if a backend config file is named "myaccount.s3.tfbackend", then the CONFIG_NAME would be "myaccount"
# -----------------------------------------------------------------------------
set -euo pipefail

MODULE_DIR="$1"
CONFIG_NAME="$2"

# Convenience script for running terraform apply
# CONFIG_NAME – the name of the backend config.
# For example if a backend config file is named "myaccount.s3.tfbackend", then the CONFIG_NAME would be "myaccount"
# MODULE_DIR – the location of the root module to initialize and apply

# 1. Set working directory to the terraform root module directory

cd "$MODULE_DIR"

# 2. Run terraform apply with the tfvars file (if it exists) that has the same name as the backend config file

TF_VARS_FILE="$CONFIG_NAME.tfvars"
TF_VARS_OPTION=""
if [ -f "$TF_VARS_FILE" ]; then
  TF_VARS_OPTION="-var-file=$TF_VARS_FILE"
fi

terraform apply "$TF_VARS_OPTION"
