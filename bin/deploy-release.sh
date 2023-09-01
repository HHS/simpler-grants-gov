#!/bin/bash
set -euo pipefail

APP_NAME=$1
IMAGE_TAG=$2
ENVIRONMENT=$3

echo "--------------"
echo "Deploy release"
echo "--------------"
echo "Input parameters:"
echo "  APP_NAME=$APP_NAME"
echo "  IMAGE_TAG=$IMAGE_TAG"
echo "  ENVIRONMENT=$ENVIRONMENT"
echo
echo "Starting $APP_NAME deploy of $IMAGE_TAG to $ENVIRONMENT"

MODULE_DIR="infra/$APP_NAME/service"
CONFIG_NAME="$ENVIRONMENT"
TF_CLI_ARGS_apply="-input=false -auto-approve -var=image_tag=$IMAGE_TAG" ./bin/terraform-init-and-apply.sh $MODULE_DIR $CONFIG_NAME

echo "Completed $APP_NAME deploy of $IMAGE_TAG to $ENVIRONMENT"
