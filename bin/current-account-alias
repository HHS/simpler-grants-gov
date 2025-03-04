#!/bin/bash
# Print the current AWS account alias
set -euo pipefail
echo -n "$(aws iam list-account-aliases --query "AccountAliases" --max-items 1 --output text)"
