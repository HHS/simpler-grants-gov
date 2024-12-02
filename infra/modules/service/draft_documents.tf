resource "aws_s3_bucket" "draft_documents" {
  count         = startswith(var.service_name, "api-") ? 1 : 0
  bucket_prefix = "${var.service_name}-documents-draft"
  force_destroy = false
  # checkov:skip=CKV2_AWS_62:Event notification not necessary for this bucket especially due to likely use of lifecycle rules
  # checkov:skip=CKV_AWS_18:Access logging was not considered necessary for this bucket
  # checkov:skip=CKV_AWS_144:Not considered critical to the point of cross region replication
  # checkov:skip=CKV_AWS_300:Known issue where Checkov gets confused by multiple rules
  # checkov:skip=CKV_AWS_21:Bucket versioning is not worth it in this use case
}

resource "aws_s3_bucket_public_access_block" "draft_documents" {
  count  = startswith(var.service_name, "api-") ? 1 : 0
  bucket = aws_s3_bucket.draft_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "draft_documents_put_access" {
  statement {
    effect = "Allow"
    resources = [
      aws_s3_bucket.draft_documents.arn,
      "${aws_s3_bucket.draft_documents.arn}/*"
    ]
    actions = ["s3:*"]

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.app_service.arn]
    }
  }

  statement {
    sid    = "AllowSSLRequestsOnly"
    effect = "Deny"
    resources = [
      aws_s3_bucket.draft_documents.arn,
      "${aws_s3_bucket.draft_documents.arn}/*"
    ]
    actions = ["s3:*"]
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = [false]
    }
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "draft_documents" {
  count  = startswith(var.service_name, "api-") ? 1 : 0
  bucket = aws_s3_bucket.draft_documents.id

  rule {
    id     = "AbortIncompleteUpload"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  # checkov:skip=CKV_AWS_300:There is a known issue where this check brings up false positives
}


resource "aws_s3_bucket_server_side_encryption_configuration" "draft_documents_encryption" {
  count = startswith(var.service_name, "api-") ? 1 : 0

  bucket = aws_s3_bucket.draft_documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "draft_documents" {
  count  = startswith(var.service_name, "api-") ? 1 : 0
  bucket = aws_s3_bucket.draft_documents.id
  policy = data.aws_iam_policy_document.draft_documents_put_access.json
}
