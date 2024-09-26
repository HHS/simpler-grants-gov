#!/bin/bash
# Print the current AWS region
set -euo pipefail
echo -n "$(aws configure list | grep region | awk '{print $2}')"
