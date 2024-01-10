resource "aws_s3_bucket" "storage" {
  bucket        = var.name
  force_destroy = false

  # checkov:skip=CKV_AWS_18:TODO(https://github.com/navapbc/template-infra/issues/507) Implement access logging

  # checkov:skip=CKV_AWS_144:Cross region replication not required by default
  # checkov:skip=CKV2_AWS_62:S3 bucket does not need notifications enabled
  # checkov:skip=CKV_AWS_21:Bucket versioning is not needed
}
