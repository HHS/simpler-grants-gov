#!/bin/bash

# Script to copy RDS snapshots between AWS accounts
# Usage: ./copy-rds-snapshots.sh <source-account> <target-account> <snapshot-identifier> [target-region]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arguments
SOURCE_ACCOUNT="${1:-}"
TARGET_ACCOUNT="${2:-}"
SNAPSHOT_IDENTIFIER="${3:-}"
TARGET_REGION="${4:-us-east-1}"
SOURCE_REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Validate arguments
if [[ -z "$SOURCE_ACCOUNT" ]] || [[ -z "$TARGET_ACCOUNT" ]] || [[ -z "$SNAPSHOT_IDENTIFIER" ]]; then
    echo -e "${RED}Error: Missing required arguments${NC}"
    echo "Usage: $0 <source-account> <target-account> <snapshot-identifier> [target-region]"
    echo "Example: $0 123456789012 987654321098 mydb-snapshot us-east-1"
    exit 1
fi

echo -e "${GREEN}=== RDS Snapshot Copy Tool ===${NC}"
echo -e "Source Account: ${YELLOW}${SOURCE_ACCOUNT}${NC}"
echo -e "Target Account: ${YELLOW}${TARGET_ACCOUNT}${NC}"
echo -e "Snapshot: ${YELLOW}${SNAPSHOT_IDENTIFIER}${NC}"
echo -e "Source Region: ${YELLOW}${SOURCE_REGION}${NC}"
echo -e "Target Region: ${YELLOW}${TARGET_REGION}${NC}"
echo ""

# Function to check AWS credentials
check_credentials() {
    local account_alias=$1
    echo -e "${GREEN}Checking AWS credentials for ${account_alias}...${NC}"
    aws sts get-caller-identity > /dev/null 2>&1 || {
        echo -e "${RED}Error: AWS credentials not configured for ${account_alias}${NC}"
        return 1
    }

    local current_account=$(aws sts get-caller-identity --query 'Account' --output text)
    echo -e "Current account: ${BLUE}${current_account}${NC}"
    return 0
}

# Function to find the latest snapshot if "latest" is specified
find_latest_snapshot() {
    local db_instance=$1
    echo -e "${GREEN}Finding latest snapshot for DB instance: ${db_instance}...${NC}"

    latest_snapshot=$(aws rds describe-db-snapshots \
        --region "$SOURCE_REGION" \
        --db-instance-identifier "$db_instance" \
        --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
        --output text 2>/dev/null)

    if [[ -z "$latest_snapshot" ]] || [[ "$latest_snapshot" == "None" ]]; then
        echo -e "${YELLOW}No automated snapshots found, checking manual snapshots...${NC}"
        latest_snapshot=$(aws rds describe-db-snapshots \
            --region "$SOURCE_REGION" \
            --query 'DBSnapshots | sort_by(@, &SnapshotCreateTime) | [-1].DBSnapshotIdentifier' \
            --output text 2>/dev/null)
    fi

    echo "$latest_snapshot"
}

# Step 1: Check current credentials
check_credentials "current" || exit 1

CURRENT_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text)

# Handle "latest" keyword for snapshot
if [[ "$SNAPSHOT_IDENTIFIER" == "latest:"* ]]; then
    DB_INSTANCE="${SNAPSHOT_IDENTIFIER#latest:}"
    SNAPSHOT_IDENTIFIER=$(find_latest_snapshot "$DB_INSTANCE")

    if [[ -z "$SNAPSHOT_IDENTIFIER" ]] || [[ "$SNAPSHOT_IDENTIFIER" == "None" ]]; then
        echo -e "${RED}Error: Could not find latest snapshot for DB instance: ${DB_INSTANCE}${NC}"
        exit 1
    fi

    echo -e "${GREEN}Using latest snapshot: ${YELLOW}${SNAPSHOT_IDENTIFIER}${NC}"
fi

# Step 2: Get snapshot details
echo -e "${GREEN}Getting snapshot details...${NC}"
SNAPSHOT_INFO=$(aws rds describe-db-snapshots \
    --region "$SOURCE_REGION" \
    --db-snapshot-identifier "$SNAPSHOT_IDENTIFIER" \
    --query 'DBSnapshots[0]' \
    2>/dev/null || echo "")

if [[ -z "$SNAPSHOT_INFO" ]] || [[ "$SNAPSHOT_INFO" == "None" ]]; then
    echo -e "${RED}Error: Snapshot ${SNAPSHOT_IDENTIFIER} not found in region ${SOURCE_REGION}${NC}"
    exit 1
fi

# Extract snapshot details
ENGINE=$(echo "$SNAPSHOT_INFO" | jq -r '.Engine')
ENGINE_VERSION=$(echo "$SNAPSHOT_INFO" | jq -r '.EngineVersion')
SNAPSHOT_ARN="arn:aws:rds:${SOURCE_REGION}:${SOURCE_ACCOUNT}:snapshot:${SNAPSHOT_IDENTIFIER}"
ALLOCATED_STORAGE=$(echo "$SNAPSHOT_INFO" | jq -r '.AllocatedStorage')
ENCRYPTED=$(echo "$SNAPSHOT_INFO" | jq -r '.Encrypted')
KMS_KEY=$(echo "$SNAPSHOT_INFO" | jq -r '.KmsKeyId // "none"')

echo -e "${BLUE}Snapshot Details:${NC}"
echo -e "  Engine: ${ENGINE} ${ENGINE_VERSION}"
echo -e "  Storage: ${ALLOCATED_STORAGE} GB"
echo -e "  Encrypted: ${ENCRYPTED}"
if [[ "$ENCRYPTED" == "true" ]]; then
    echo -e "  KMS Key: ${KMS_KEY}"
fi
echo ""

# Step 3: Share snapshot with target account (if different accounts)
if [[ "$CURRENT_ACCOUNT" == "$SOURCE_ACCOUNT" ]] && [[ "$SOURCE_ACCOUNT" != "$TARGET_ACCOUNT" ]]; then
    echo -e "${GREEN}Sharing snapshot with target account ${TARGET_ACCOUNT}...${NC}"

    aws rds modify-db-snapshot-attribute \
        --region "$SOURCE_REGION" \
        --db-snapshot-identifier "$SNAPSHOT_IDENTIFIER" \
        --attribute-name restore \
        --values-to-add "$TARGET_ACCOUNT" \
        || { echo -e "${RED}Failed to share snapshot${NC}"; exit 1; }

    echo -e "${GREEN}Snapshot shared successfully${NC}"

    # If encrypted, we need to share the KMS key too
    if [[ "$ENCRYPTED" == "true" ]] && [[ "$KMS_KEY" != "none" ]]; then
        echo -e "${GREEN}Sharing KMS key with target account...${NC}"

        # Get current key policy
        KEY_POLICY=$(aws kms get-key-policy \
            --region "$SOURCE_REGION" \
            --key-id "$KMS_KEY" \
            --policy-name default \
            --query 'Policy' \
            --output text)

        echo -e "${YELLOW}Note: You may need to manually update the KMS key policy to grant access to account ${TARGET_ACCOUNT}${NC}"
        echo -e "${YELLOW}Add the following to the key policy statements:${NC}"
        cat <<EOF
{
    "Sid": "Allow use of the key for RDS in target account",
    "Effect": "Allow",
    "Principal": {
        "AWS": "arn:aws:iam::${TARGET_ACCOUNT}:root"
    },
    "Action": [
        "kms:Decrypt",
        "kms:CreateGrant",
        "kms:DescribeKey"
    ],
    "Resource": "*",
    "Condition": {
        "StringEquals": {
            "kms:ViaService": "rds.${TARGET_REGION}.amazonaws.com"
        }
    }
}
EOF
    fi
fi

# Step 4: Copy snapshot to target account/region
echo ""
echo -e "${GREEN}Initiating snapshot copy...${NC}"

# Generate target snapshot identifier
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TARGET_SNAPSHOT_ID="${SNAPSHOT_IDENTIFIER}-copy-${TIMESTAMP}"

# Prepare copy command based on whether we're copying across accounts or regions
if [[ "$SOURCE_ACCOUNT" == "$TARGET_ACCOUNT" ]] || [[ "$CURRENT_ACCOUNT" == "$TARGET_ACCOUNT" ]]; then
    # Same account or we're in the target account

    if [[ "$SOURCE_REGION" == "$TARGET_REGION" ]]; then
        # Same region, same account - just create a copy
        echo -e "${GREEN}Creating snapshot copy in the same account and region...${NC}"

        COPY_RESULT=$(aws rds copy-db-snapshot \
            --region "$TARGET_REGION" \
            --source-db-snapshot-identifier "$SNAPSHOT_IDENTIFIER" \
            --target-db-snapshot-identifier "$TARGET_SNAPSHOT_ID" \
            --tags Key=Project,Value=simpler-grants-gov Key=Source,Value="${SOURCE_ACCOUNT}" \
            --query 'DBSnapshot.DBSnapshotIdentifier' \
            --output text \
            2>&1) || {
                echo -e "${RED}Failed to copy snapshot: ${COPY_RESULT}${NC}"
                exit 1
            }
    else
        # Different region copy
        echo -e "${GREEN}Copying snapshot to different region...${NC}"

        SOURCE_SNAPSHOT_ARN="arn:aws:rds:${SOURCE_REGION}:${CURRENT_ACCOUNT}:snapshot:${SNAPSHOT_IDENTIFIER}"

        COPY_RESULT=$(aws rds copy-db-snapshot \
            --region "$TARGET_REGION" \
            --source-db-snapshot-identifier "$SOURCE_SNAPSHOT_ARN" \
            --target-db-snapshot-identifier "$TARGET_SNAPSHOT_ID" \
            --tags Key=Project,Value=simpler-grants-gov Key=Source,Value="${SOURCE_ACCOUNT}" \
            --query 'DBSnapshot.DBSnapshotIdentifier' \
            --output text \
            2>&1) || {
                echo -e "${RED}Failed to copy snapshot: ${COPY_RESULT}${NC}"
                exit 1
            }
    fi
else
    echo -e "${YELLOW}Cross-account copy requires you to be logged into the target account${NC}"
    echo -e "${YELLOW}Please switch to the target account and run:${NC}"
    echo ""
    echo -e "${BLUE}aws rds copy-db-snapshot \\
    --region ${TARGET_REGION} \\
    --source-db-snapshot-identifier arn:aws:rds:${SOURCE_REGION}:${SOURCE_ACCOUNT}:snapshot:${SNAPSHOT_IDENTIFIER} \\
    --target-db-snapshot-identifier ${TARGET_SNAPSHOT_ID}${NC}"
    echo ""
    TARGET_SNAPSHOT_ID="<pending-manual-copy>"
fi

if [[ "$TARGET_SNAPSHOT_ID" != "<pending-manual-copy>" ]]; then
    echo -e "${GREEN}Snapshot copy initiated: ${YELLOW}${TARGET_SNAPSHOT_ID}${NC}"

    # Wait for snapshot copy to complete
    echo -e "${GREEN}Waiting for snapshot copy to complete (this may take several minutes)...${NC}"

    # Poll status every 30 seconds
    while true; do
        STATUS=$(aws rds describe-db-snapshots \
            --region "$TARGET_REGION" \
            --db-snapshot-identifier "$TARGET_SNAPSHOT_ID" \
            --query 'DBSnapshots[0].Status' \
            --output text 2>/dev/null || echo "not-found")

        if [[ "$STATUS" == "available" ]]; then
            echo -e "${GREEN}Snapshot copy completed successfully!${NC}"
            break
        elif [[ "$STATUS" == "not-found" ]]; then
            echo -e "${YELLOW}Waiting for snapshot to appear...${NC}"
        elif [[ "$STATUS" == "creating" ]] || [[ "$STATUS" == "copying" ]]; then
            echo -e "${BLUE}Status: ${STATUS} - waiting...${NC}"
        else
            echo -e "${RED}Unexpected status: ${STATUS}${NC}"
            exit 1
        fi

        sleep 30
    done
fi

# Step 5: Generate Terraform configuration
echo ""
echo -e "${GREEN}Generating Terraform configuration...${NC}"

cat > "rds-snapshot-${TARGET_ACCOUNT}.tf" <<EOF
# RDS Snapshot Configuration for Target Account ${TARGET_ACCOUNT}
# Generated on $(date)

variable "rds_snapshot_identifier" {
  description = "The identifier of the RDS snapshot to use"
  type        = string
  default     = "${TARGET_SNAPSHOT_ID}"
}

# Data source to reference the copied snapshot
data "aws_db_snapshot" "copied_snapshot" {
  db_snapshot_identifier = var.rds_snapshot_identifier
  most_recent            = true
}

# Example RDS instance from snapshot
resource "aws_db_instance" "from_snapshot" {
  identifier = "simpler-grants-db-from-snapshot"

  # Restore from snapshot
  snapshot_identifier = data.aws_db_snapshot.copied_snapshot.id

  # Instance configuration
  instance_class        = "db.t3.medium"  # Adjust as needed
  allocated_storage     = ${ALLOCATED_STORAGE}
  storage_encrypted     = ${ENCRYPTED}

  # Engine configuration
  engine         = "${ENGINE}"
  engine_version = "${ENGINE_VERSION}"

  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Other settings
  skip_final_snapshot       = false
  final_snapshot_identifier = "\${var.environment}-final-snapshot-\${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  deletion_protection      = true

  tags = {
    Project     = "simpler-grants-gov"
    Environment = var.environment
    Source      = "snapshot-${SNAPSHOT_IDENTIFIER}"
    CopiedFrom  = "${SOURCE_ACCOUNT}"
  }
}

output "rds_endpoint" {
  value       = aws_db_instance.from_snapshot.endpoint
  description = "The RDS instance endpoint"
}

output "rds_snapshot_used" {
  value       = var.rds_snapshot_identifier
  description = "The snapshot identifier used for restoration"
}
EOF

echo -e "${GREEN}Terraform configuration saved to: rds-snapshot-${TARGET_ACCOUNT}.tf${NC}"

# Summary
echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo -e "Source Snapshot: ${YELLOW}${SNAPSHOT_IDENTIFIER}${NC}"
if [[ "$TARGET_SNAPSHOT_ID" != "<pending-manual-copy>" ]]; then
    echo -e "Target Snapshot: ${YELLOW}${TARGET_SNAPSHOT_ID}${NC}"
    echo -e "Target Region: ${YELLOW}${TARGET_REGION}${NC}"
    echo -e "Status: ${GREEN}Complete${NC}"
else
    echo -e "Status: ${YELLOW}Manual copy required (see instructions above)${NC}"
fi
echo ""
echo "Next steps:"
echo "1. Review the generated Terraform configuration"
echo "2. Update your main Terraform code to use the new snapshot"
echo "3. Run 'terraform plan' to verify the changes"
echo "4. Apply the changes with 'terraform apply'"