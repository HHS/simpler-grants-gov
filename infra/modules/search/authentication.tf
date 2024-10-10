locals {
  task_executor_role_name = "${var.service_name}-task-executor"
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
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AWSAdministratorAccess_7531ec3bb3ba9352"
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

resource "random_password" "opensearch_username" {
  # loose requirements so its easy to type by hand if necessary
  length      = 16
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
  special     = false
}

resource "random_password" "opensearch_password" {
  # very strict requirements!!!
  length           = 128
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  min_special      = 1
  special          = true
  override_special = "-"
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

data "aws_iam_policy_document" "opensearch_access" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::315341936575:root"]
    }
    effect    = "Allow"
    actions   = ["es:*"]
    resources = ["arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.service_name}/*"]
  }
}

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

data "aws_iam_policy_document" "allow_vpc_access" {
  statement {
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.task_executor_role_name}"]
    }
    actions   = ["es:*"]
    resources = ["${aws_opensearch_domain.opensearch.arn}/*"]
  }
}

resource "aws_opensearch_domain_policy" "main" {
  domain_name     = aws_opensearch_domain.opensearch.domain_name
  access_policies = data.aws_iam_policy_document.allow_vpc_access.json
}
