#!/bin/bash
# Print the current AWS account id
set -euo pipefail
echo -n "$(aws sts get-caller-identity --query "Account" --output text)"
