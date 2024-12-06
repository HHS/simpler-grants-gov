#!/bin/bash
set -euo pipefail

APP_NAME=$1
IMAGE_TAG=$2
ENVIRONMENT=$3
DEPLOY_GITHUB_REF=$4
DEPLOY_GITHUB_SHA=$5

echo "--------------"
echo "Deploy release"
echo "--------------"
echo "Input parameters:"
echo "  APP_NAME=$APP_NAME"
echo "  IMAGE_TAG=$IMAGE_TAG"
echo "  ENVIRONMENT=$ENVIRONMENT"
echo "  DEPLOY_GITHUB_REF=$DEPLOY_GITHUB_REF"
echo "  DEPLOY_GITHUB_SHA=$DEPLOY_GITHUB_SHA"
echo
echo "Starting $APP_NAME deploy of $IMAGE_TAG to $ENVIRONMENT"

TF_CLI_ARGS_apply="-input=false -auto-approve -var=image_tag=$IMAGE_TAG" make infra-update-app-service APP_NAME="$APP_NAME" ENVIRONMENT="$ENVIRONMENT" DEPLOY_GITHUB_REF="$DEPLOY_GITHUB_REF" DEPLOY_GITHUB_SHA="$DEPLOY_GITHUB_SHA"

echo "Completed $APP_NAME deploy of $IMAGE_TAG to $ENVIRONMENT"
