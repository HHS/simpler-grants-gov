#!/bin/bash
# -----------------------------------------------------------------------------
# Convenience script for running terraform init for the specified module and configuration name.
# The configuration name is used to determine which .tfbackend file to use for the -backend-config
# option of terraform init.
#
# Positional parameters:
# module_dir (required) – The location of the root module to initialize and apply
# config_name (required) – The name of the backend config. For accounts, the config name is the AWS account alias.
#   For application modules, the config name is the name of the environment (e.g. "dev", "staging", "prod").
#   For application modules that are shared across environments, the config name is "shared".
#   For example, if a backend config file is named "myaccount.s3.tfbackend", then the config_name would be "myaccount"
# -----------------------------------------------------------------------------
set -euo pipefail

module_dir="$1"
config_name="$2"

# Run terraform init with the named backend config file

backend_config_file="$config_name.s3.tfbackend"

# Note that the backend_config_file path is relative to module_dir, not the current working directory
terraform -chdir="$module_dir" init \
  -input=false \
  -reconfigure \
  -backend-config="$backend_config_file"
