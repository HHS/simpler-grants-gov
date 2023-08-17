# Terraform S3 backend module

This module creates resources for an [S3 backend for Terraform](https://www.terraform.io/language/settings/backends/s3). It creates the following resources:

* S3 bucket to store [Terraform state files](https://www.terraform.io/language/state)
* S3 bucket to store [S3 access logs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ServerLogs.html)
* DynamoDB table to manage [terraform state locks](https://www.terraform.io/language/state/locking)
