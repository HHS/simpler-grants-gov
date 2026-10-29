# AWS Infrastructure Bootstrap & RDS Migration Tools

This repository contains scripts and configurations for bootstrapping new AWS accounts and migrating RDS snapshots for the Simpler Grants Gov project.

## 📋 Overview

These tools address two critical infrastructure tasks:

1. **Issue #10949**: Procure and bootstrap new AWS accounts with Terraform state management
2. **Issue #10950**: Copy RDS snapshots between AWS accounts for database migration

## 🚀 Quick Start

### Prerequisites

- AWS CLI installed and configured
- Appropriate IAM permissions in source and target AWS accounts
- Terraform installed (for applying configurations)
- `jq` installed (for JSON parsing in scripts)

## 📦 Contents

### 1. AWS Account Bootstrap Script

**File:** `bootstrap-aws-account.sh`

Automates the setup of new AWS accounts with:
- S3 bucket for Terraform state storage
- DynamoDB table for state locking
- Proper encryption and security settings
- Generated backend configuration files

#### Usage

```bash
./bootstrap-aws-account.sh <environment> <account-id> [region]

# Examples
./bootstrap-aws-account.sh dev 123456789012 us-east-1
./bootstrap-aws-account.sh staging 987654321098 us-west-2
./bootstrap-aws-account.sh prod 456789012345 eu-west-1
```

#### What it creates

- **S3 Bucket**: `simpler-grants-gov-{env}-{account-id}-{region}-tf`
  - Versioning enabled
  - AES256 encryption
  - Public access blocked
  - Tagged for project tracking

- **DynamoDB Table**: `simpler-grants-gov-{env}-tf-state-lock`
  - Pay-per-request billing
  - Used for Terraform state locking
  - Tagged for project tracking

- **Backend Config File**: `{env}.s3.tfbackend`
  - Ready-to-use Terraform backend configuration
  - Includes all necessary settings

### 2. RDS Snapshot Copy Script

**File:** `copy-rds-snapshots.sh`

Facilitates copying RDS snapshots between AWS accounts and regions with:
- Automatic snapshot sharing between accounts
- Cross-region copy support
- KMS key handling for encrypted snapshots
- Terraform configuration generation

#### Usage

```bash
./copy-rds-snapshots.sh <source-account> <target-account> <snapshot-id> [target-region]

# Examples
# Copy specific snapshot
./copy-rds-snapshots.sh 123456789012 987654321098 mydb-snapshot us-east-1

# Copy latest snapshot from a DB instance
./copy-rds-snapshots.sh 123456789012 987654321098 latest:mydb-instance us-east-1
```

#### Features

- **Automatic Latest Snapshot**: Use `latest:db-instance-name` to automatically find and copy the most recent snapshot
- **Cross-Account Sharing**: Automatically shares snapshots with target account
- **KMS Key Handling**: Provides instructions for sharing encrypted snapshots
- **Progress Monitoring**: Tracks copy progress and waits for completion
- **Terraform Generation**: Creates ready-to-use Terraform configuration for the copied snapshot

### 3. Pre-configured Backend Files

Ready-to-use backend configurations for different environments:

- `dev.s3.tfbackend` - Development environment
- `staging.s3.tfbackend` - Staging environment
- `prod.s3.tfbackend` - Production environment

## 🔧 Integration with Existing Infrastructure

### Step 1: Bootstrap New Account

When you receive access to a new AWS account:

```bash
# 1. Configure AWS credentials for the new account
aws configure --profile new-account

# 2. Export the profile
export AWS_PROFILE=new-account

# 3. Run bootstrap script
./bootstrap-aws-account.sh dev 123456789012 us-east-1

# 4. Copy generated backend config to your terraform directory
cp dev.s3.tfbackend ~/simpler-grants-gov/infra/accounts/
```

### Step 2: Initialize Terraform

```bash
cd ~/simpler-grants-gov/infra/accounts

# Initialize with new backend
terraform init -backend-config=dev.s3.tfbackend

# Import existing resources if needed
terraform import aws_s3_bucket.example bucket-name
```

### Step 3: Copy RDS Snapshots

```bash
# 1. List available snapshots in source account
aws rds describe-db-snapshots --region us-east-1 \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# 2. Copy snapshot to target account
./copy-rds-snapshots.sh 123456789012 987654321098 prod-db-snapshot-2024 us-east-1

# 3. Review generated Terraform config
cat rds-snapshot-987654321098.tf

# 4. Integrate into your Terraform code
```

## 📝 Terraform Integration Example

After running the scripts, integrate with your existing Terraform code:

```hcl
# backend.tf
terraform {
  backend "s3" {
    # Configured via backend-config file
  }
}

# rds.tf
module "database" {
  source = "./modules/rds"

  # Use the copied snapshot
  snapshot_identifier = var.rds_snapshot_identifier

  # Other configuration...
}
```

## 🔒 Security Considerations

### Account Bootstrap
- All S3 buckets have encryption enabled by default
- Public access is blocked on all buckets
- DynamoDB tables use on-demand billing to avoid unused capacity
- Resources are tagged for cost tracking and compliance

### RDS Snapshot Copies
- Encrypted snapshots require KMS key sharing
- Cross-account copies require explicit snapshot sharing
- Generated Terraform includes deletion protection by default
- Final snapshots are configured to prevent data loss

## 🐛 Troubleshooting

### Common Issues

#### 1. Bootstrap Script Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify you're in the correct account
aws sts get-caller-identity --query Account --output text
```

#### 2. RDS Snapshot Not Found
```bash
# List all available snapshots
aws rds describe-db-snapshots --region us-east-1

# Check automated snapshots
aws rds describe-db-snapshots \
  --snapshot-type automated \
  --db-instance-identifier your-db-name
```

#### 3. KMS Key Access Denied
When copying encrypted snapshots, you need to update the KMS key policy in the source account to grant access to the target account. The script provides the necessary policy statement.

## 📊 Validation Checklist

After running the scripts, verify:

- [ ] S3 bucket exists and is accessible
- [ ] DynamoDB table exists and is active
- [ ] Backend configuration file is correct
- [ ] Terraform init succeeds with new backend
- [ ] RDS snapshot is visible in target account
- [ ] Terraform plan shows expected resources

## 🤝 Contributing

When making changes:

1. Test scripts in a non-production environment first
2. Update this README with any new features
3. Follow the existing naming conventions
4. Add appropriate error handling

## 📞 Support

For issues or questions:
- Check the [Simpler Grants Gov repository](https://github.com/HHS/simpler-grants-gov)
- Review related issues: #10949, #10950
- Contact the infrastructure team

## 📅 Next Steps

After using these tools:

1. Update your CI/CD pipelines to use the new backend configurations
2. Migrate any existing state files to the new backend
3. Set up automated snapshot copying if needed
4. Document account IDs and regions in your team wiki

---

*Generated for Simpler Grants Gov Infrastructure - Sprint 6.5*