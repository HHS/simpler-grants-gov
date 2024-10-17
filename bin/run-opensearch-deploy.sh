#!/bin/bash
# --------------------------------------------------------------------------------------------
# Positional parameters:
#   ENVIRONMENT (required) - the name of the application environment (e.g. dev, staging, prod)
# --------------------------------------------------------------------------------------------
set -euo pipefail
set -x

ENVIRONMENT="$1"

make release-build APP_NAME=ecs-terraform

make release-publish APP_NAME=ecs-terraform

make release-deploy APP_NAME=ecs-terraform ENVIRONMENT=dev

COMMAND=$(
  cat <<EOF
[
  "set -x && terraform -chdir=infra/api/search init -input=false -reconfigure -backend-config=$ENVIRONMENT.s3.tfbackend && terraform -chdir=infra/api/search apply -var=environment_name=$ENVIRONMENT -auto-approve"
]
EOF
)

./bin/run-command.sh "ecs-terraform" "$ENVIRONMENT" "$COMMAND"
