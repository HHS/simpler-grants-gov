# Terraform S3 backend module

This module creates resources for an [S3 backend for Terraform](https://www.terraform.io/language/settings/backends/s3). It creates the following resources:

* S3 bucket to store [Terraform state files](https://www.terraform.io/language/state)
* S3 bucket to store [S3 access logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)
* (Optional, deprecated) DynamoDB table to manage terraform state locks

## State Locking

As of Terraform 1.7+, [S3 native state locking](https://developer.hashicorp.com/terraform/language/backend/s3#s3-state-locking) is available and is now the recommended approach. This uses S3 conditional writes instead of DynamoDB for locking.

To use S3 native locking, set `use_lockfile = true` in your backend configuration:

```hcl
bucket       = "my-terraform-state-bucket"
key          = "path/to/state.tfstate"
use_lockfile = true
region       = "us-east-1"
```

The `enable_dynamodb_lock_table` variable (default: `false`) controls whether a DynamoDB table is created for legacy locking. This should only be set to `true` for backwards compatibility with existing deployments that need to maintain their DynamoDB table.
