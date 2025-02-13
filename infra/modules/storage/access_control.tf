# Block public access
resource "aws_s3_bucket_public_access_block" "storage" {
  bucket = aws_s3_bucket.storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy that requires HTTPS
resource "aws_s3_bucket_policy" "storage" {
  bucket = aws_s3_bucket.storage.id
  policy = data.aws_iam_policy_document.storage.json
}

data "aws_iam_policy_document" "storage" {
  statement {
    sid       = "RestrictToTLSRequestsOnly"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.storage.arn]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# Create policy for read/write access
# Attach this policy to roles that need access to the bucket
resource "aws_iam_policy" "storage_access" {
  name   = "${var.name}-access"
  policy = data.aws_iam_policy_document.storage_access.json
}

data "aws_iam_policy_document" "storage_access" {
  statement {
    actions = [
      "s3:DeleteObject",
      "s3:DeleteObjectTagging",
      "s3:GetObject",
      "s3:GetObjectAttributes",
      "s3:GetObjectTagging",
      "s3:ListBucket",
      "s3:PutObject",
      "s3:PutObjectTagging",
    ]
    effect = "Allow"
    resources = [
      "arn:aws:s3:::${var.name}",
      "arn:aws:s3:::${var.name}/*"
    ]
  }
  statement {
    actions   = ["kms:GenerateDataKey", "kms:Decrypt"]
    effect    = "Allow"
    resources = [aws_kms_key.storage.arn]
  }
}
