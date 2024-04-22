# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/region
data "aws_region" "current" {}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/caller_identity
data "aws_caller_identity" "current" {}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group
resource "aws_cloudwatch_log_group" "opensearch" {
  name_prefix = "opensearch-${var.environment_name}"

  # Conservatively retain logs for 5 years.
  retention_in_days = 1827

  # checkov:skip=CKV_AWS_158:skip requirement to encrypt with customer managed KMS key
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/security_group
resource "aws_security_group" "opensearch" {
  name_prefix = "opensearch-${var.environment_name}"
  description = "Security group for OpenSearch domain ${var.environment_name}"
  vpc_id      = data.aws_vpc.network.id

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"

    cidr_blocks = [
      data.aws_vpc.network.cidr_block,
    ]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document
data "aws_iam_policy_document" "opensearch_access" {
  statement {
    effect = "Allow"
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    actions   = ["es:*"]
    resources = ["arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.environment_name}/*"]
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document
data "aws_iam_policy_document" "opensearch_cloudwatch" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["es.amazonaws.com"]
    }
    actions = [
      "logs:PutLogEvents",
      "logs:PutLogEventsBatch",
      "logs:CreateLogStream",
    ]
    resources = ["arn:aws:logs:*"]
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/secretsmanager_random_password
data "aws_secretsmanager_random_password" "opensearch_username" {
  password_length = 16
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter
resource "aws_ssm_parameter" "opensearch_username" {
  name        = "/opensearch/${var.environment_name}/username"
  description = "The username for the OpenSearch domain"
  type        = "SecureString"
  value       = data.aws_secretsmanager_random_password.opensearch_username.random_password
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/secretsmanager_random_password
data "aws_secretsmanager_random_password" "opensearch_password" {
  password_length = 16
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ssm_parameter
resource "aws_ssm_parameter" "opensearch_password" {
  name        = "/opensearch/${var.environment_name}/password"
  description = "The password for the OpenSearch domain"
  type        = "SecureString"
  value       = data.aws_secretsmanager_random_password.opensearch_password.random_password
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_resource_policy
resource "aws_cloudwatch_log_resource_policy" "opensearch" {
  policy_name     = "opensearch-${var.environment_name}"
  policy_document = data.aws_iam_policy_document.opensearch_cloudwatch.json
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/opensearch_domain
resource "aws_opensearch_domain" "opensearch" {
  domain_name     = var.environment_name
  engine_version  = "OpenSearch_2.11"
  access_policies = data.aws_iam_policy_document.opensearch_access.json

  encrypt_at_rest {
    enabled = true
  }

  cluster_config {
    instance_type                 = "m6g.large.search"
    dedicated_master_type         = "m6g.large.search"
    multi_az_with_standby_enabled = true
    zone_awareness_enabled        = true
    dedicated_master_enabled      = true
    instance_count                = 3
    dedicated_master_count        = 3
    zone_awareness_config {
      availability_zone_count = 3
    }
  }

  advanced_security_options {
    enabled                        = true
    anonymous_auth_enabled         = true
    internal_user_database_enabled = true
    master_user_options {
      master_user_name     = data.aws_secretsmanager_random_password.opensearch_username.random_password
      master_user_password = data.aws_secretsmanager_random_password.opensearch_password.random_password
    }
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 10
  }

  node_to_node_encryption {
    enabled = true
  }

  domain_endpoint_options {
    enforce_https       = true
    tls_security_policy = "Policy-Min-TLS-1-2-2019-07"
  }

  vpc_options {
    subnet_ids         = data.aws_subnets.database.ids
    security_group_ids = [aws_security_group.opensearch.id]
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "AUDIT_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "ES_APPLICATION_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "INDEX_SLOW_LOGS"
  }

  log_publishing_options {
    cloudwatch_log_group_arn = aws_cloudwatch_log_group.opensearch.arn
    log_type                 = "SEARCH_SLOW_LOGS"
  }

  software_update_options {
    auto_software_update_enabled = true
  }

  # checkov:skip=CKV_AWS_247:skip requirement to encrypt with customer managed KMS key
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/opensearch_vpc_endpoint
resource "aws_opensearch_vpc_endpoint" "opensearch" {
  domain_arn = aws_opensearch_domain.opensearch.arn
  vpc_options {
    subnet_ids         = data.aws_subnets.database.ids
    security_group_ids = [aws_security_group.opensearch.id]
  }
}
