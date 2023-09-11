#!/bin/bash
# -----------------------------------------------------------------------------
# Run database migrations
# 1. Update the application's task definition with the latest build, but
#    do not update the service
# 2. Run the "db-migrate" command in the container as a new task
#
# Positional parameters:
#   APP_NAME (required) – the name of subdirectory of /infra that holds the
#     application's infrastructure code.
#   IMAGE_TAG (required) – the tag of the latest build
#   ENVIRONMENT (required) – the name of the application environment (e.g. dev,
#     staging, prod)
# -----------------------------------------------------------------------------

# TODO: Use migrator role instead of general role. Part 3 of multipart update https://github.com/navapbc/template-infra/issues/354#issuecomment-1693973424

set -euo pipefail

APP_NAME="$1"
IMAGE_TAG="$2"
ENVIRONMENT="$3"

echo "=================="
echo "Running migrations"
echo "=================="
echo "Input parameters"
echo "  APP_NAME=$APP_NAME"
echo "  IMAGE_TAG=$IMAGE_TAG"
echo "  ENVIRONMENT=$ENVIRONMENT"
echo
echo "Step 0. Check if app has a database"

terraform -chdir="infra/$APP_NAME/app-config" init > /dev/null
terraform -chdir="infra/$APP_NAME/app-config" refresh > /dev/null
HAS_DATABASE=$(terraform -chdir="infra/$APP_NAME/app-config" output -raw has_database)
if [ "$HAS_DATABASE" = "false" ]; then
  echo "Application does not have a database, no migrations to run"
  exit 0
fi

DB_MIGRATOR_USER=$(terraform -chdir="infra/$APP_NAME/app-config" output -json environment_configs | jq -r ".$ENVIRONMENT.database_config.migrator_username")

echo
echo "::group::Step 1. Update task definition without updating service"

TF_CLI_ARGS_apply="-input=false -auto-approve -target=module.service.aws_ecs_task_definition.app -var=image_tag=$IMAGE_TAG" make infra-update-app-service APP_NAME="$APP_NAME" ENVIRONMENT="$ENVIRONMENT"

echo "::endgroup::"
echo
echo 'Step 2. Run "db-migrate" command'

COMMAND='["db-migrate"]'

# Indent the later lines more to make the output of run-command prettier
ENVIRONMENT_VARIABLES=$(cat << EOF
[{ "name" : "DB_USER", "value" : "$DB_MIGRATOR_USER" }]
EOF
)

./bin/run-command.sh "$APP_NAME" "$ENVIRONMENT" "$COMMAND" "$ENVIRONMENT_VARIABLES"
