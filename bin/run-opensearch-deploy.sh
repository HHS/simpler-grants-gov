#!/bin/bash
# --------------------------------------------------------------------------------------------
# Positional parameters:
#   ENVIRONMENT (required) - the name of the application environment (e.g. dev, staging, prod)
# --------------------------------------------------------------------------------------------
set -euo pipefail

ENVIRONMENT="$1"

COMMAND=$(
  cat <<EOF
[
  "terraform -chdir=infra/api/search init -input=false -reconfigure -backend-config=$ENVIRONMENT.s3.tfbackend"
]
EOF
)

# COMMAND=$(
#   cat <<EOF
# [
#   "terraform", "-chdir=infra/api/search", "init", "-input=false", "-reconfigure", "-backend-config=$ENVIRONMENT.s3.tfbackend", "&&",
#   "terraform", "-chdir=infra/api/search", "apply", "-var=environment_name=$ENVIRONMENT", "-auto-approve"
# ]
# EOF
# )

./bin/run-command.sh "ecs-terraform" "$ENVIRONMENT" "$COMMAND"
