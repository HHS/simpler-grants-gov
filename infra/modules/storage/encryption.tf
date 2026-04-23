
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_iam_policy_document" "kms_key_policy" {
  # checkov:skip=CKV_AWS_109:Root account requires full KMS permissions to enable IAM-based access control
  # checkov:skip=CKV_AWS_111:Root account requires full KMS permissions to enable IAM-based access control
  # checkov:skip=CKV_AWS_356:In a key policy, the wildcard character in the Resource element represents the KMS key to which the key policy is attached.

  # This gives the AWS account that owns the KMS key full access to the KMS key,
  # deferring specific access rules to IAM roles.
  #
  # This is the default key policy for programmatically generated KMS keys in
  # general, see: https://docs.aws.amazon.com/kms/latest/developerguide/key-policy-default.html#key-policy-default-allow-root-enable-iam
  statement {
    sid    = "Enable IAM User Permissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Optional: Allow the given AWS service principals to use the key via S3, for situations
  # where the service can't use more explicitly configured IAM roles
  dynamic "statement" {
    for_each = length(var.service_principals_with_access) > 0 ? [1] : []
    content {
      sid    = "AllowViaS3Service"
      effect = "Allow"
      principals {
        type        = "Service"
        identifiers = var.service_principals_with_access
      }
      actions = [
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ]
      resources = ["*"]
      condition {
        test     = "StringEquals"
        variable = "kms:ViaService"
        values   = ["s3.${data.aws_region.current.name}.amazonaws.com"]
      }
    }
  }
}

resource "aws_kms_key" "storage" {
  description = "KMS key for bucket ${var.name}"
  # The waiting period, specified in number of days. After the waiting period ends, AWS KMS deletes the KMS key.
  deletion_window_in_days = "10"
  # Generates new cryptographic material every 365 days, this is used to encrypt your data. The KMS key retains the old material for decryption purposes.
  enable_key_rotation = "true"

  policy = data.aws_iam_policy_document.kms_key_policy.json
}

resource "aws_s3_bucket_server_side_encryption_configuration" "storage" {
  bucket = aws_s3_bucket.storage.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.storage.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}
