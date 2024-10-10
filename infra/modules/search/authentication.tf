locals {
  task_executor_role_name = "${var.service_name}-task-executor"
}

resource "aws_kms_key" "opensearch" {
  description         = "Key for Opensearch Domain ${var.name}"
  enable_key_rotation = true
  policy = jsonencode({
    Id      = var.name,
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
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/*"
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
        Sid       = "Allow access to AWS managed services",
        Effect    = "Allow",
        Principal = { AWS = ["*"] },
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
        Condition = {
          "ForAnyValue:StringLike" = {
            # The service we are granting access to is OpenSearch, which is somtimes denoted as "os" in AWS.
            # And other times as "es" (for "ElasticSearch"). So we just allow both, to be safe.
            "kms:ViaService" : [
              "os.${data.aws_region.current.name}.amazonaws.com",
              "es.${data.aws_region.current.name}.amazonaws.com"
            ]
          },
          Bool = {
            "kms:GrantIsForAWSResource" : true
          }
        }
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
  name        = "/search/${var.name}/username"
  description = "The username for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_username.result
  key_id      = aws_kms_key.opensearch.arn
}

resource "aws_ssm_parameter" "opensearch_password" {
  name        = "/search/${var.name}/password"
  description = "The password for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_password.result
  key_id      = aws_kms_key.opensearch.arn
}

resource "aws_ssm_parameter" "opensearch_endpoint" {
  name        = "/search/${var.name}/endpoint"
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
    resources = ["arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.name}/*"]
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
