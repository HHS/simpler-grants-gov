#===================================
# SBOM (Software Bill of Materials) Storage
#===================================
# Environment-specific S3 buckets for storing SBOM artifacts
# with encryption, versioning, lifecycle policies, and audit logging

data "aws_iam_role" "github_actions" {
  name = module.project_config.github_actions_role_name
}

locals {
  # Environment names that should have SBOM buckets
  sbom_environments = ["dev", "staging", "training", "grantee1", "grantee2", "grantor1", "prod"]
}

# SBOM S3 Buckets - one per environment
resource "aws_s3_bucket" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket_prefix = "sbom-${each.key}-"
  force_destroy = false

  # checkov:skip=CKV2_AWS_62:Event notification not necessary for SBOM buckets
  # checkov:skip=CKV_AWS_144:Cross region replication not required for SBOM buckets
}

# Enable versioning for SBOM artifacts
resource "aws_s3_bucket_versioning" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with AES-256
resource "aws_s3_bucket_server_side_encryption_configuration" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Bucket policy - enforce SSL/TLS and restrict access
data "aws_iam_policy_document" "sbom" {
  for_each = toset(local.sbom_environments)

  # Deny all requests that don't use SSL/TLS
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.sbom[each.key].arn,
      "${aws_s3_bucket.sbom[each.key].arn}/*"
    ]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Allow GitHub Actions role to write SBOM artifacts
  statement {
    sid    = "AllowGitHubActionsWrite"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [data.aws_iam_role.github_actions.arn]
    }
    actions = [
      "s3:PutObject",
      "s3:PutObjectAcl",
      "s3:GetObject",
      "s3:GetObjectVersion",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.sbom[each.key].arn,
      "${aws_s3_bucket.sbom[each.key].arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id
  policy = data.aws_iam_policy_document.sbom[each.key].json
}

# Lifecycle policy - transition old versions to IA, then expire
resource "aws_s3_bucket_lifecycle_configuration" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id

  # Abort incomplete multipart uploads after 7 days
  rule {
    id     = "AbortIncompleteMultipartUpload"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # Transition old versions to IA storage after 90 days
  rule {
    id     = "TransitionOldVersions"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "STANDARD_IA"
    }
  }

  # Delete old versions after 365 days (1 year retention)
  rule {
    id     = "ExpireOldVersions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# Enable access logging for audit trail
resource "aws_s3_bucket_logging" "sbom" {
  for_each = toset(local.sbom_environments)

  bucket = aws_s3_bucket.sbom[each.key].id

  target_bucket = aws_s3_bucket.sbom_access_logs.id
  target_prefix = "${each.key}/"
}

# Central bucket for SBOM access logs
resource "aws_s3_bucket" "sbom_access_logs" {
  bucket_prefix = "sbom-access-logs-"
  force_destroy = false

  # checkov:skip=CKV2_AWS_62:Event notification not necessary for access logs
  # checkov:skip=CKV_AWS_144:Cross region replication not required for access logs
  # checkov:skip=CKV_AWS_18:Access logs don't need their own access logging
}

resource "aws_s3_bucket_server_side_encryption_configuration" "sbom_access_logs" {
  bucket = aws_s3_bucket.sbom_access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "sbom_access_logs" {
  bucket = aws_s3_bucket.sbom_access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy for access logs - delete after 90 days
resource "aws_s3_bucket_lifecycle_configuration" "sbom_access_logs" {
  bucket = aws_s3_bucket.sbom_access_logs.id

  rule {
    id     = "ExpireAccessLogs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }

  rule {
    id     = "AbortIncompleteMultipartUpload"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Grant S3 service permission to write access logs
data "aws_iam_policy_document" "sbom_access_logs" {
  statement {
    sid    = "S3ServerAccessLogsPolicy"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }
    actions = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.sbom_access_logs.arn}/*"
    ]
  }
}

resource "aws_s3_bucket_policy" "sbom_access_logs" {
  bucket = aws_s3_bucket.sbom_access_logs.id
  policy = data.aws_iam_policy_document.sbom_access_logs.json
}

# Store bucket names in SSM for easy reference
resource "aws_ssm_parameter" "sbom_bucket_names" {
  for_each = toset(local.sbom_environments)

  name  = "/sbom/buckets/${each.key}/name"
  type  = "String"
  value = aws_s3_bucket.sbom[each.key].id
}

resource "aws_ssm_parameter" "sbom_bucket_arns" {
  for_each = toset(local.sbom_environments)

  name  = "/sbom/buckets/${each.key}/arn"
  type  = "String"
  value = aws_s3_bucket.sbom[each.key].arn
}
