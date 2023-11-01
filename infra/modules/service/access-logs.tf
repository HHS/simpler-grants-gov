# This file defines resources for load balancer access logs
# including the S3 bucket where access logs are stored and
# the IAM policy granting the AWS Elastic Load Balancer service
# to write to the bucket
locals {
  # This is needed to gran~t permissions to the ELB service for sending access logs to S3.
  # The list was obtained from https://docs.aws.amazon.com/elasticloadbalancing/latest/application/enable-access-logging.html
  elb_account_map = {
    "us-east-1" : "127311923021",
    "us-east-2" : "033677994240",
    "us-west-1" : "027434742980",
    "us-west-2" : "797873946194"
  }

  # set log_file_transition = {} to disable lifecycle transitions. Additional lifecycle transitions can be added via a key value pair of `$STORAGE_CLASS=$DAYS`
  log_file_transition = {
    STANDARD_IA = 30
    GLACIER     = 60
  }
}

resource "aws_s3_bucket" "access_logs" {
  bucket_prefix = "${var.service_name}-access-logs"
  force_destroy = false
  # checkov:skip=CKV2_AWS_62:Event notification not necessary for this bucket expecially due to likely use of lifecycle rules
  # checkov:skip=CKV_AWS_18:Access logging was not considered necessary for this bucket
  # checkov:skip=CKV_AWS_144:Not considered critical to the point of cross region replication
  # checkov:skip=CKV_AWS_300:Known issue where Checkov gets confused by multiple rules
  # checkov:skip=CKV_AWS_21:Bucket versioning is not worth it in this use case
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "access_logs_put_access" {
  statement {
    effect = "Allow"
    resources = [
      aws_s3_bucket.access_logs.arn,
      "${aws_s3_bucket.access_logs.arn}/*"
    ]
    actions = ["s3:PutObject"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.elb_account_map[data.aws_region.current.name]}:root"]
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    id     = "AbortIncompleteUpload"
    status = "Enabled"
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }

  rule {
    id     = "StorageClass"
    status = "Enabled"
    dynamic "transition" {
      for_each = local.log_file_transition
      content {
        days          = transition.value
        storage_class = transition.key
      }
    }
  }

  rule {
    id     = "Expiration"
    status = "Enabled"
    expiration {
      days = 2555
    }
  }
  # checkov:skip=CKV_AWS_300:There is a known issue where this check brings up false positives
}


resource "aws_s3_bucket_server_side_encryption_configuration" "encryption" {
  bucket = aws_s3_bucket.access_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  policy = data.aws_iam_policy_document.access_logs_put_access.json
}
