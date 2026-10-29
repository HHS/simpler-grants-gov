#!/bin/bash

# Bootstrap script for new AWS accounts for Simpler Grants Gov
# Usage: ./bootstrap-aws-account.sh <environment> <account-id> <region>

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Arguments
ENVIRONMENT="${1:-}"
ACCOUNT_ID="${2:-}"
REGION="${3:-us-east-1}"

# Validate arguments
if [[ -z "$ENVIRONMENT" ]] || [[ -z "$ACCOUNT_ID" ]]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <environment> <account-id> [region]"
    echo "Example: $0 dev 123456789012 us-east-1"
    exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Environment must be dev, staging, or prod${NC}"
    exit 1
fi

# Set variables
BUCKET_NAME="simpler-grants-gov-${ENVIRONMENT}-${ACCOUNT_ID}-${REGION}-tf"
DYNAMODB_TABLE="simpler-grants-gov-${ENVIRONMENT}-tf-state-lock"
BACKEND_CONFIG_FILE="${ENVIRONMENT}.s3.tfbackend"

echo -e "${GREEN}=== Bootstrapping AWS Account for Simpler Grants Gov ===${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Account ID: ${YELLOW}${ACCOUNT_ID}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo ""

# Check AWS credentials
echo -e "${GREEN}Checking AWS credentials...${NC}"
aws sts get-caller-identity > /dev/null 2>&1 || {
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
}

CURRENT_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text)
if [[ "$CURRENT_ACCOUNT" != "$ACCOUNT_ID" ]]; then
    echo -e "${YELLOW}Warning: Current AWS account ($CURRENT_ACCOUNT) doesn't match target account ($ACCOUNT_ID)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create S3 bucket for Terraform state
echo -e "${GREEN}Creating S3 bucket for Terraform state...${NC}"
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo -e "${YELLOW}S3 bucket $BUCKET_NAME already exists${NC}"
else
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        $(if [[ "$REGION" != "us-east-1" ]]; then echo "--create-bucket-configuration LocationConstraint=$REGION"; fi) \
        || { echo -e "${RED}Failed to create S3 bucket${NC}"; exit 1; }

    echo -e "${GREEN}S3 bucket created successfully${NC}"
fi

# Enable versioning on the bucket
echo -e "${GREEN}Enabling versioning on S3 bucket...${NC}"
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled \
    || { echo -e "${RED}Failed to enable versioning${NC}"; exit 1; }

# Enable encryption on the bucket
echo -e "${GREEN}Enabling encryption on S3 bucket...${NC}"
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }' \
    || { echo -e "${RED}Failed to enable encryption${NC}"; exit 1; }

# Block public access
echo -e "${GREEN}Blocking public access on S3 bucket...${NC}"
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" \
    || { echo -e "${RED}Failed to block public access${NC}"; exit 1; }

# Create DynamoDB table for state locking
echo -e "${GREEN}Creating DynamoDB table for state locking...${NC}"
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$REGION" 2>/dev/null; then
    echo -e "${YELLOW}DynamoDB table $DYNAMODB_TABLE already exists${NC}"
else
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$REGION" \
        --tags Key=Project,Value=simpler-grants-gov Key=Environment,Value="$ENVIRONMENT" \
        || { echo -e "${RED}Failed to create DynamoDB table${NC}"; exit 1; }

    echo -e "${GREEN}DynamoDB table created successfully${NC}"

    # Wait for table to be active
    echo -e "${GREEN}Waiting for DynamoDB table to become active...${NC}"
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$REGION"
fi

# Create backend configuration file
echo -e "${GREEN}Creating Terraform backend configuration file...${NC}"
cat > "$BACKEND_CONFIG_FILE" <<EOF
bucket         = "${BUCKET_NAME}"
key            = "infra/account.tfstate"
region         = "${REGION}"
encrypt        = true
dynamodb_table = "${DYNAMODB_TABLE}"
use_lockfile   = true
EOF

echo -e "${GREEN}Backend configuration written to ${BACKEND_CONFIG_FILE}${NC}"

# Add tags to resources
echo -e "${GREEN}Adding tags to resources...${NC}"
aws s3api put-bucket-tagging \
    --bucket "$BUCKET_NAME" \
    --tagging '{
        "TagSet": [
            {"Key": "Project", "Value": "simpler-grants-gov"},
            {"Key": "Environment", "Value": "'"$ENVIRONMENT"'"},
            {"Key": "Purpose", "Value": "terraform-state"},
            {"Key": "ManagedBy", "Value": "terraform"}
        ]
    }' \
    || echo -e "${YELLOW}Warning: Failed to add tags to S3 bucket${NC}"

echo ""
echo -e "${GREEN}=== Bootstrap Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Copy ${BACKEND_CONFIG_FILE} to your Terraform configuration directory"
echo "2. Initialize Terraform with: terraform init -backend-config=${BACKEND_CONFIG_FILE}"
echo "3. Import any existing resources as needed"
echo ""
echo "Resources created:"
echo "- S3 Bucket: $BUCKET_NAME"
echo "- DynamoDB Table: $DYNAMODB_TABLE"
echo "- Backend Config: $BACKEND_CONFIG_FILE"