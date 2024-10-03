resource "random_password" "opensearch_username" {
  length           = 16
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  special          = true
  override_special = "-"
}

# The master password must be generated 5 ~ 10 times before you can get a master password that meets the requirements.
# This is because the master password cannot be fully configured to meet opensearch requirements. The error message
# you'll get is:
#
#   ValidationException: The master user password must contain at least one uppercase letter, one lowercase letter,
#   one number, and one special character.
#
# The password generated is supposed to meet these requirements, but for some reason it often doesn't.
# Thusly, we generate the password multiple times until we get one that meets the requirements.
resource "random_password" "opensearch_password" {
  length           = 16
  min_lower        = 1
  min_upper        = 1
  min_numeric      = 1
  special          = true
  override_special = "-"
}

resource "aws_ssm_parameter" "opensearch_username" {
  name        = "/opensearch/${var.environment_name}/username"
  description = "The username for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_username.result

}

resource "aws_ssm_parameter" "opensearch_password" {
  name        = "/opensearch/${var.environment_name}/password"
  description = "The password for the OpenSearch domain"
  type        = "SecureString"
  value       = random_password.opensearch_password.result
}

data "aws_iam_policy_document" "opensearch_access" {
  statement {
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::315341936575:root"]
    }
    effect    = "Allow"
    actions   = ["es:*"]
    resources = ["arn:aws:es:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:domain/${var.environment_name}/*"]
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
