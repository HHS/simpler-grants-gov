#!/bin/bash
# Print the config name for the current AWS account
# Do this by getting the current account and searching for a file in
# infra/accounts that matches "<account name>.<account id>.s3.tfbackend".
# The config name is "<account name>.<account id>""
set -euo pipefail
ls -1 infra/accounts | grep "$(./bin/current-account-id.sh)" | grep s3.tfbackend | sed 's/.s3.tfbackend//'
