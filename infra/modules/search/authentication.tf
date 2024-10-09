resource "random_password" "opensearch_username" {
  # loose requirements so its easy to type by hand if necessary
  length      = 16
  min_lower   = 1
  min_upper   = 1
  min_numeric = 1
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

resource "aws_kms_key" "opensearch" {
  description         = "Key for Opensearch Domain ${var.name}"
  enable_key_rotation = true
  policy = jsonencode({
    Version = "2012-10-17"
    Id      = var.name
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow administration of the key for all users"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/*"
        },
        Action = [
          "kms:*",
        ],
        Resource = "*"
      },
      {
        Sid    = "Allow administration of the key for all roles"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/*"
        },
        Action = [
          "kms:*",
        ],
        Resource = "*"
      },
    ]
  })
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
