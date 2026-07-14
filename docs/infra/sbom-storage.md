# SBOM Storage Infrastructure

## Overview

This document describes the S3 bucket infrastructure for storing Software Bill of Materials (SBOM) artifacts for each environment.

## Architecture

### S3 Buckets

One SBOM bucket is created per environment:
- `sbom-dev-*`
- `sbom-staging-*`
- `sbom-training-*`
- `sbom-grantee1-*`
- `sbom-grantee2-*`
- `sbom-grantor1-*`
- `sbom-prod-*`

Plus one central bucket for access logs:
- `sbom-access-logs-*`

### Security Features

**Encryption:**
- All buckets use S3-managed encryption (AES-256)
- `bucket_key_enabled` for cost optimization

**Access Control:**
- All buckets block public access completely
- Only GitHub Actions role has write access
- SSL/TLS enforced for all requests (denies `aws:SecureTransport=false`)

**Versioning:**
- All SBOM buckets have versioning enabled
- Allows tracking SBOM changes over time and rollback if needed

**Audit Logging:**
- S3 access logs enabled on all SBOM buckets
- Logs stored in central `sbom-access-logs-*` bucket
- Logs organized by environment: `{environment}/`

### Lifecycle Policies

**SBOM Buckets:**
1. **Abort incomplete uploads** - 7 days
2. **Transition old versions to Infrequent Access** - after 90 days
3. **Delete old versions** - after 365 days (1 year retention)

**Access Logs Bucket:**
1. **Expire logs** - after 90 days
2. **Abort incomplete uploads** - 7 days

### IAM Permissions

The GitHub Actions role has the following permissions on SBOM buckets:
- `s3:PutObject` - Upload SBOM artifacts
- `s3:PutObjectAcl` - Set object ACLs
- `s3:GetObject` - Download SBOM artifacts
- `s3:GetObjectVersion` - Access specific versions
- `s3:ListBucket` - List bucket contents

## Usage

### Uploading SBOM Artifacts

From GitHub Actions workflows:

```yaml
- name: Upload SBOM to S3
  env:
    AWS_REGION: us-east-2
  run: |
    # Retrieve bucket name from SSM
    SBOM_BUCKET=$(aws ssm get-parameter \
      --name "/sbom/buckets/${{ env.ENVIRONMENT }}/name" \
      --query 'Parameter.Value' \
      --output text)

    # Upload SBOM artifact
    aws s3 cp sbom.json "s3://${SBOM_BUCKET}/api/${{ github.sha }}/sbom.json" \
      --metadata "git-sha=${{ github.sha }},workflow-run=${{ github.run_id }}"
```

### Retrieving Bucket Names

Bucket names are stored in SSM parameters for easy reference:

```bash
# Get bucket name
aws ssm get-parameter --name "/sbom/buckets/prod/name" --query 'Parameter.Value' --output text

# Get bucket ARN
aws ssm get-parameter --name "/sbom/buckets/prod/arn" --query 'Parameter.Value' --output text
```

Or from Terraform outputs:

```bash
cd infra/accounts
terraform output sbom_buckets
terraform output sbom_bucket_arns
```

### Downloading SBOM Artifacts

```bash
# List SBOMs for a specific environment
aws s3 ls s3://sbom-prod-abc123/

# Download specific SBOM
aws s3 cp s3://sbom-prod-abc123/api/abc123def456/sbom.json ./sbom.json

# Download with version
aws s3api get-object \
  --bucket sbom-prod-abc123 \
  --key api/abc123def456/sbom.json \
  --version-id ABC123VERSION \
  sbom.json
```

### Viewing Access Logs

```bash
# List access logs for dev environment
aws s3 ls s3://sbom-access-logs-xyz789/dev/

# Download logs for analysis
aws s3 sync s3://sbom-access-logs-xyz789/dev/ ./logs/dev/
```

## Compliance

### Security Hub Controls

This infrastructure satisfies the following AWS Security Hub controls:

- **S3.1**: Server-side encryption enabled (AES-256)
- **S3.4**: S3 Block Public Access enabled
- **S3.5**: SSL/TLS required for all requests
- **S3.6**: Versioning enabled on SBOM buckets
- **S3.9**: Access logging enabled
- **S3.13**: Lifecycle policies configured

### Data Retention

- **Current SBOM versions**: Retained indefinitely
- **Old SBOM versions**: 1 year retention (365 days)
- **Access logs**: 90 day retention

### Audit Trail

Access logs provide an audit trail for:
- Who accessed which SBOM artifacts
- When artifacts were uploaded/downloaded
- Source IP addresses
- API operations performed

## Maintenance

### Adding New Environments

To add SBOM buckets for a new environment:

1. Add environment name to `local.sbom_environments` in `infra/accounts/sbom.tf`:
   ```terraform
   locals {
     sbom_environments = ["dev", "staging", "training", "grantee1", "grantee2", "grantor1", "prod", "new-env"]
   }
   ```

2. Apply changes:
   ```bash
   cd infra/accounts
   terraform apply
   ```

### Monitoring

Monitor SBOM bucket usage with CloudWatch metrics:
- `BucketSizeBytes` - Total storage used
- `NumberOfObjects` - Total objects stored
- Access logs can be analyzed for security monitoring

## Terraform Resources

All resources are defined in `infra/accounts/sbom.tf`:

- `aws_s3_bucket.sbom[*]` - SBOM storage buckets
- `aws_s3_bucket.sbom_access_logs` - Access log storage
- `aws_s3_bucket_versioning.sbom[*]` - Versioning configuration
- `aws_s3_bucket_server_side_encryption_configuration.sbom[*]` - Encryption config
- `aws_s3_bucket_public_access_block.sbom[*]` - Public access blocking
- `aws_s3_bucket_policy.sbom[*]` - Bucket policies
- `aws_s3_bucket_lifecycle_configuration.sbom[*]` - Lifecycle rules
- `aws_s3_bucket_logging.sbom[*]` - Access logging config
- `aws_ssm_parameter.sbom_bucket_names[*]` - SSM parameters for bucket names
- `aws_ssm_parameter.sbom_bucket_arns[*]` - SSM parameters for bucket ARNs

## References

- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html)
- [SBOM Format Specifications](https://www.ntia.gov/sbom)
- [Security Hub S3 Controls](https://docs.aws.amazon.com/securityhub/latest/userguide/s3-controls.html)
