mock_provider "aws" {}

variables {
  name = "my-test-bucket-12345"
}

run "creates_bucket_with_given_name" {
  command = plan

  assert {
    condition     = aws_s3_bucket.storage.bucket == var.name
    error_message = "S3 bucket name should match var.name"
  }
}

run "force_destroy_disabled_by_default" {
  command = plan

  assert {
    condition     = aws_s3_bucket.storage.force_destroy == var.is_temporary
    error_message = "Bucket should not force-destroy unless is_temporary is true"
  }
}

run "force_destroy_enabled_when_temporary" {
  command = plan

  variables {
    is_temporary = true
  }

  assert {
    condition     = aws_s3_bucket.storage.force_destroy == var.is_temporary
    error_message = "Bucket should allow force-destroy when is_temporary is true"
  }
}

run "kms_key_has_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.storage.enable_key_rotation == true
    error_message = "KMS key must have automatic rotation enabled"
  }
}

run "public_access_is_fully_blocked" {
  command = plan

  assert {
    condition     = aws_s3_bucket_public_access_block.storage.block_public_acls == true
    error_message = "Public ACLs must be blocked"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.storage.block_public_policy == true
    error_message = "Public bucket policies must be blocked"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.storage.ignore_public_acls == true
    error_message = "Public ACLs must be ignored"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.storage.restrict_public_buckets == true
    error_message = "Public bucket access must be restricted"
  }
}

run "encryption_uses_kms_algorithm" {
  command = plan

  assert {
    condition = anytrue([
      for rule in aws_s3_bucket_server_side_encryption_configuration.storage.rule :
      anytrue([
        for config in rule.apply_server_side_encryption_by_default :
        config.sse_algorithm == "aws:kms"
      ])
    ])
    error_message = "Storage bucket must use KMS server-side encryption"
  }
}

run "eventbridge_notifications_are_enabled" {
  command = plan

  assert {
    condition     = aws_s3_bucket_notification.storage.eventbridge == true
    error_message = "EventBridge notifications must be enabled on the storage bucket"
  }
}

run "lifecycle_rule_aborts_incomplete_uploads" {
  command = plan

  assert {
    condition     = anytrue([for r in aws_s3_bucket_lifecycle_configuration.storage.rule : r.id == "AbortIncompleteUpload"])
    error_message = "Lifecycle rule to abort incomplete multipart uploads must exist"
  }

  assert {
    condition = anytrue([
      for r in aws_s3_bucket_lifecycle_configuration.storage.rule :
      anytrue([
        for a in r.abort_incomplete_multipart_upload :
        a.days_after_initiation == 7
      ])
    ])
    error_message = "Incomplete uploads must be aborted after 7 days"
  }
}
