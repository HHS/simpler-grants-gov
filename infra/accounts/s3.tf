#===================================
# S3
#===================================

# S3.1: Enable S3 Block Public Access at account level
# This prevents accidental public exposure of S3 buckets across the entire account
resource "aws_s3_account_public_access_block" "main" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
