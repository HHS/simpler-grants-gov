data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

terraform {
  required_providers {
    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "2.3.1"
    }
  }
}

provider "opensearch" {
  url = aws_opensearch_domain.opensearch.endpoint
}

resource "aws_cloudwatch_log_group" "opensearch" {
  retention_in_days = 1827
  name_prefix       = "opensearch-${var.service_name}"
  kms_key_id        = aws_kms_key.opensearch.arn
}

resource "aws_cloudwatch_log_resource_policy" "opensearch" {
  policy_name     = "opensearch-${var.service_name}"
  policy_document = data.aws_iam_policy_document.opensearch_cloudwatch.json
}

resource "aws_opensearch_domain" "opensearch" {
  domain_name     = var.service_name
  engine_version  = var.engine_version
  access_policies = data.aws_iam_policy_document.opensearch_access.json

  encrypt_at_rest {
    enabled    = true
    kms_key_id = aws_kms_key.opensearch.arn
  }

  cluster_config {
    multi_az_with_standby_enabled = var.multi_az_with_standby_enabled
    zone_awareness_enabled        = var.zone_awareness_enabled
    dedicated_master_enabled      = var.dedicated_master_enabled
    dedicated_master_type         = var.dedicated_master_type
    instance_count                = var.instance_count
    instance_type                 = var.instance_type
    dedicated_master_count        = var.dedicated_master_count
    zone_awareness_config {
      availability_zone_count = var.availability_zone_count
    }
  }

  advanced_security_options {
    enabled                        = true
    anonymous_auth_enabled         = false
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = random_password.opensearch_username.result
      master_user_password = random_password.opensearch_password.result
    }
  }

  ebs_options {
    ebs_enabled = true
    volume_size = var.volume_size
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  vpc_options {
    subnet_ids         = var.subnet_ids
    security_group_ids = [aws_security_group.opensearch.id]
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "AUDIT_LOGS"
    enabled                  = true
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "ES_APPLICATION_LOGS"
    enabled                  = true
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "INDEX_SLOW_LOGS"
    enabled                  = true
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "SEARCH_SLOW_LOGS"
    enabled                  = true
  }

  software_update_options {
    auto_software_update_enabled = true
  }

  # checkov:skip=CKV_AWS_318: false positve, we use a high availability setup in prod
  # checkov:skip=CKV2_AWS_59: false positve, we use a high availability setup in prod
}
