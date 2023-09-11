#!/bin/bash

set -euo pipefail

APP_NAME=$1
IMAGE_NAME=$2
IMAGE_TAG=$3

echo "---------------"
echo "Publish release"
echo "---------------"
echo "Input parameters:"
echo "  APP_NAME=$APP_NAME"
echo "  IMAGE_NAME=$IMAGE_NAME"
echo "  IMAGE_TAG=$IMAGE_TAG"

# Need to init module when running in CD since GitHub actions does a fresh checkout of repo
terraform -chdir="infra/$APP_NAME/app-config" init > /dev/null
terraform -chdir="infra/$APP_NAME/app-config" refresh > /dev/null
IMAGE_REPOSITORY_NAME=$(terraform -chdir="infra/$APP_NAME/app-config" output -raw image_repository_name)

REGION=$(./bin/current-region.sh)
read -r IMAGE_REGISTRY_ID IMAGE_REPOSITORY_URL <<< "$(aws ecr describe-repositories --repository-names "$IMAGE_REPOSITORY_NAME" --query "repositories[0].[registryId,repositoryUri]" --output text)"
IMAGE_REGISTRY="$IMAGE_REGISTRY_ID.dkr.ecr.$REGION.amazonaws.com"

echo "Build repository info:"
echo "  REGION=$REGION"
echo "  IMAGE_REGISTRY=$IMAGE_REGISTRY"
echo "  IMAGE_REPOSITORY_NAME=$IMAGE_REPOSITORY_NAME"
echo "  IMAGE_REPOSITORY_URL=$IMAGE_REPOSITORY_URL"
echo
echo "Authenticating Docker with ECR"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$IMAGE_REGISTRY"
echo
echo "Check if tag has already been published..."
RESULT=""
RESULT=$(aws ecr describe-images --repository-name "$IMAGE_REPOSITORY_NAME" --image-ids "imageTag=$IMAGE_TAG" --region "$REGION" 2> /dev/null ) || true
if [ -n "$RESULT" ];then
  echo "Image with tag $IMAGE_TAG already published"
  exit 0
fi

echo "New tag. Publishing image"
docker tag "$IMAGE_NAME:$IMAGE_TAG" "$IMAGE_REPOSITORY_URL:$IMAGE_TAG"
docker push "$IMAGE_REPOSITORY_URL:$IMAGE_TAG"
