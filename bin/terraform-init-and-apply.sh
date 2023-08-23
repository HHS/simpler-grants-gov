#!/bin/bash
# -----------------------------------------------------------------------------
# Convenience script for running terraform init followed by terraform apply
# See ./bin/terraform-init.sh and ./bin/terraform-apply.sh for more details.
#
# Positional parameters:
# MODULE_DIR (required) – The location of the root module to initialize and apply
# CONFIG_NAME (required) – The name of the tfbackend and tfvars config. The name
#   is expected to be consistent for both the tfvars file and the tfbackend file.
# -----------------------------------------------------------------------------
set -euo pipefail

MODULE_DIR="$1"
CONFIG_NAME="$2"

# Convenience script for running terraform init and terraform apply
# CONFIG_NAME – the name of the backend config.
# For example if a backend config file is named "myaccount.s3.tfbackend", then the CONFIG_NAME would be "myaccount"
# MODULE_DIR – the location of the root module to initialize and apply

./bin/terraform-init.sh $MODULE_DIR $CONFIG_NAME

./bin/terraform-apply.sh $MODULE_DIR $CONFIG_NAME
