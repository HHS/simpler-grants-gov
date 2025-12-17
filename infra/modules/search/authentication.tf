locals {
  task_executor_role_name = "${var.service_name}-task-executor"

  # Default role ARNs based on service naming convention. The default roles are created in the database module.
  ingest_role_arn = var.ingest_role_arn != null ? var.ingest_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.service_name}-migrator"
  query_role_arn  = var.query_role_arn != null ? var.query_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.service_name}-app"
}

# Master user credentials for the OpenSearch domain
# These are required by the domain's advanced_security_options but are NOT used for application authentication
# Application authentication uses IAM (SigV4) instead
# Keeping these ensures the domain is not recreated and data is preserved
resource "random_password" "opensearch_username" {
  length      = 16
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  special     = false
}

resource "random_password" "opensearch_password" {
  length           = 128
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
  special          = true
  override_special = "-"
}

resource "aws_kms_alias" "opensearch" {
  name          = "alias/search/${var.service_name}"
  target_key_id = aws_kms_key.opensearch.key_id
}

resource "aws_kms_key" "opensearch" {
  description         = "Key for Opensearch Domain ${var.service_name}"
  enable_key_rotation = true
  policy = jsonencode({
    Id      = var.service_name,
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "Enable IAM User Permissions",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "Allow access for SSOed humans",
        Effect = "Allow",
        Principal = {
          AWS = var.sso_admin_role_arn != null ? var.sso_admin_role_arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*",
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key to the task executor role (eg. the ECS task)",
        Effect = "Allow",
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.task_executor_role_name}"
        },
        Action = [
          "kms:List*",
          "kms:Describe*",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:CreateGrant",
          "kms:RevokeGrant",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ],
        Resource = "*"
      },
      {
        Sid    = "Allow access to the key for CloudWatch Logs",
        Effect = "Allow",
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
        },
        Action = [
          "kms:List*",
          "kms:Describe*",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:CreateGrant",
          "kms:RevokeGrant",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ],
        Resource = "*"
        Condition = {
          ArnEquals = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:*"
          }
        }
      },
      {
        Sid = "Allow access to AWS OpenSearch",
        Principal = {
          Service = "es.${data.aws_region.current.name}.amazonaws.com"
        },
        Effect = "Allow",
        Action = [
          "kms:List*",
          "kms:Describe*",
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:CreateGrant",
          "kms:RevokeGrant",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*"
        ],
        Resource = "*",
      },
    ]
  })
}

resource "aws_ssm_parameter" "opensearch_username" {
  name        = "/search/${var.service_name}/username"
  description = "The username for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_username.result
  key_id      = aws_kms_key.opensearch.arn
}

resource "aws_ssm_parameter" "opensearch_password" {
  name        = "/search/${var.service_name}/password"
  description = "The password for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_password.result
  key_id      = aws_kms_key.opensearch.arn
}

resource "aws_ssm_parameter" "opensearch_endpoint" {
  name        = "/search/${var.service_name}/endpoint"
  description = "The endpoint for the OpenSearch domain"
  type        = "SecureString"
  value       = aws_opensearch_domain.opensearch.endpoint
  key_id      = aws_kms_key.opensearch.arn
}

# IAM access policy for OpenSearch
# Restricts access to only the specified ingest and query IAM roles
data "aws_iam_policy_document" "iam_access_control" {
  # checkov:skip=CKV_AWS_283:Security API statement uses "*" principal but is scoped to /_plugins/_security/* path only, domain is in private VPC, and FGAC (basic auth) provides authentication
  # Ingest role - has write access for bulk operations, index management
  statement {
    sid    = "IngestRoleAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [local.ingest_role_arn]
    }
    actions = [
      "es:ESHttpPost",   # Bulk operations, _search, create documents
      "es:ESHttpPut",    # Create/update indices, mappings, pipelines, documents
      "es:ESHttpDelete", # Delete documents, indices
      "es:ESHttpGet",    # Read index settings, mappings, get documents
      "es:ESHttpHead",   # Check index/document existence
    ]
    resources = [
      "${aws_opensearch_domain.opensearch.arn}",
      "${aws_opensearch_domain.opensearch.arn}/*"
    ]
  }

  # Query role - read-only access for search operations
  statement {
    sid    = "QueryRoleAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [local.query_role_arn]
    }
    actions = [
      "es:ESHttpGet",  # Read documents, index settings
      "es:ESHttpPost", # Search queries via POST _search
      "es:ESHttpHead", # Check existence
    ]
    resources = [
      "${aws_opensearch_domain.opensearch.arn}",
      "${aws_opensearch_domain.opensearch.arn}/*"
    ]
  }

  # SSO Admin access - allows SSOed humans to manage the domain
  dynamic "statement" {
    for_each = var.sso_admin_role_arn != null ? [1] : []
    content {
      sid    = "SSOAdminAccess"
      effect = "Allow"
      principals {
        type        = "AWS"
        identifiers = [var.sso_admin_role_arn]
      }
      actions = [
        "es:ESHttp*",
      ]
      resources = [
        "${aws_opensearch_domain.opensearch.arn}",
        "${aws_opensearch_domain.opensearch.arn}/*"
      ]
    }
  }

  # Security API access - allows configuring FGAC role mappings via master user (basic auth)
  # This is scoped to only the Security API path and the domain is in a private VPC
  # FGAC (basic auth with master user) provides the actual authentication
  statement {
    sid    = "SecurityAPIAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    actions = [
      "es:ESHttpGet",  # Read existing role mappings
      "es:ESHttpPut",  # Create/update role mappings
      "es:ESHttpPost", # Some Security API operations
    ]
    resources = [
      "${aws_opensearch_domain.opensearch.arn}/_plugins/_security/*"
    ]
  }
}

resource "aws_opensearch_domain_policy" "main" {
  domain_name     = aws_opensearch_domain.opensearch.domain_name
  access_policies = data.aws_iam_policy_document.iam_access_control.json
}

#-------------------------------------------
# IAM Policies for OpenSearch Access
# These policies are attached to service roles
#-------------------------------------------

# Policy document for ingest operations (write-heavy)
data "aws_iam_policy_document" "opensearch_ingest" {
  statement {
    sid    = "OpenSearchIngestAccess"
    effect = "Allow"
    actions = [
      "es:ESHttpPost",   # Bulk operations, create documents
      "es:ESHttpPut",    # Create/update indices, mappings, pipelines
      "es:ESHttpDelete", # Delete documents, indices
      "es:ESHttpGet",    # Read index settings, mappings
      "es:ESHttpHead",   # Check index existence
    ]
    resources = [
      "${aws_opensearch_domain.opensearch.arn}",
      "${aws_opensearch_domain.opensearch.arn}/*"
    ]
  }
}

# Policy document for query operations (read-only)
data "aws_iam_policy_document" "opensearch_query" {
  statement {
    sid    = "OpenSearchQueryAccess"
    effect = "Allow"
    actions = [
      "es:ESHttpGet",  # Read documents, index settings
      "es:ESHttpPost", # Search queries via POST _search
      "es:ESHttpHead", # Check existence
    ]
    resources = [
      "${aws_opensearch_domain.opensearch.arn}",
      "${aws_opensearch_domain.opensearch.arn}/*"
    ]
  }
}

# IAM Policy for ingest role attachment
resource "aws_iam_policy" "opensearch_ingest" {
  name        = "${var.service_name}-opensearch-ingest"
  description = "Allows ingest operations on the ${var.service_name} OpenSearch domain"
  policy      = data.aws_iam_policy_document.opensearch_ingest.json
}

# IAM Policy for query role attachment
resource "aws_iam_policy" "opensearch_query" {
  name        = "${var.service_name}-opensearch-query"
  description = "Allows query operations on the ${var.service_name} OpenSearch domain"
  policy      = data.aws_iam_policy_document.opensearch_query.json
}
