#!/bin/bash

set -euo pipefail

APP_NAME=$1
IMAGE_NAME=$2
IMAGE_TAG=$3

echo "---------------"
echo "Pull release"
echo "---------------"
echo "Input parameters:"
echo "  APP_NAME=$APP_NAME"
echo "  IMAGE_NAME=$IMAGE_NAME"
echo "  IMAGE_TAG=$IMAGE_TAG"

# Need to init module when running in CD since GitHub actions does a fresh checkout of repo
terraform -chdir=infra/$APP_NAME/app-config init > /dev/null
terraform -chdir=infra/$APP_NAME/app-config refresh > /dev/null
IMAGE_REPOSITORY_NAME=$(terraform -chdir=infra/$APP_NAME/app-config output -raw image_repository_name)

REGION=$(./bin/current-region.sh)
read -r IMAGE_REGISTRY_ID IMAGE_REPOSITORY_URL <<< $(aws ecr describe-repositories --repository-names $IMAGE_REPOSITORY_NAME --query "repositories[0].[registryId,repositoryUri]" --output text)
IMAGE_REGISTRY=$IMAGE_REGISTRY_ID.dkr.ecr.$REGION.amazonaws.com

echo "Build repository info:"
echo "  REGION=$REGION"
echo "  IMAGE_REGISTRY=$IMAGE_REGISTRY"
echo "  IMAGE_REPOSITORY_NAME=$IMAGE_REPOSITORY_NAME"
echo "  IMAGE_REPOSITORY_URL=$IMAGE_REPOSITORY_URL"
echo
echo "Authenticating Docker with ECR"
aws ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin $IMAGE_REGISTRY
echo

echo "Pulling image"
docker pull $IMAGE_REPOSITORY_URL:$IMAGE_TAG

# Provide output of image name for use in GitHub Actions
echo "IMAGE_NAME=$IMAGE_REPOSITORY_URL:$IMAGE_TAG" >> $GITHUB_ENV
