mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }
}

variables {
  name                 = "my-app"
  push_access_role_arn = "arn:aws:iam::123456789012:role/github-actions"
}

run "ecr_repo_name_matches_variable" {
  command = plan

  assert {
    condition     = aws_ecr_repository.app.name == var.name
    error_message = "ECR repository name should match var.name"
  }
}

run "image_tags_are_immutable" {
  command = plan

  assert {
    condition     = aws_ecr_repository.app.image_tag_mutability == "IMMUTABLE"
    error_message = "Image tags must be immutable to prevent tag overwrites"
  }
}

run "scan_on_push_is_enabled" {
  command = plan

  assert {
    condition     = aws_ecr_repository.app.image_scanning_configuration[0].scan_on_push == true
    error_message = "Vulnerability scanning on push must be enabled"
  }
}

run "encryption_type_is_kms" {
  command = plan

  assert {
    condition     = aws_ecr_repository.app.encryption_configuration[0].encryption_type == "KMS"
    error_message = "ECR repository must use KMS encryption"
  }
}

run "kms_key_has_automatic_rotation" {
  command = plan

  assert {
    condition     = aws_kms_key.ecr_kms.enable_key_rotation == true
    error_message = "KMS key for ECR must have automatic rotation enabled"
  }
}

run "no_cross_account_pull_by_default" {
  command = plan

  assert {
    condition     = length(var.app_account_ids) == 0
    error_message = "app_account_ids should default to empty — no cross-account pull access by default"
  }
}

run "output_repository_name_matches_variable" {
  command = plan

  assert {
    condition     = output.image_repository_name == var.name
    error_message = "Output image_repository_name should match var.name"
  }
}
