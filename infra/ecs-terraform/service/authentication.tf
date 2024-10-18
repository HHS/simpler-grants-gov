locals {
  extra_policies = {
    "search-deployment" = aws_iam_policy.search_deployment.arn
  }
}

data "aws_ssm_parameter" "search_kms_key_arn" {
  name = "/search/api-${var.environment_name}/kms_key_arn"
}

data "aws_ssm_parameter" "dynamodb_kms_key_arn" {
  name = "/dynamodb/kms_key_arn"
}

data "aws_iam_policy_document" "search_deployment" {
  statement {
    sid       = "ReadSearchSSMParameters"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/search/api-${var.environment_name}/endpoint",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/search/api-${var.environment_name}/username",
      "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/search/api-${var.environment_name}/password"
    ]
  }

  statement {
    sid     = "ReadSearchKMSKey"
    effect  = "Allow"
    actions = ["kms:Decrypt"]
    resources = [
      data.aws_ssm_parameter.search_kms_key_arn.value,
      data.aws_ssm_parameter.dynamodb_kms_key_arn.value
    ]
  }

  statement {
    sid       = "ReadTerraformS3Bucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf"]
  }

  statement {
    sid       = "WriteSearchS3Objects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf/infra/api/opensearch/${var.environment_name}.tfstate"]
  }

  statement {
    sid    = "ReadwriteTerraformDynamodb"
    effect = "Allow"
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = ["arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf-state-locks"]
  }

  statement {
    sid = "TestingOpensearchAdminAccess"
    effect = "Allow"
    actions = [
      "es:*",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "search_deployment" {
  name        = "search-deployment"
  description = "The policy for deploying our Opensearch configuration"
  policy      = data.aws_iam_policy_document.search_deployment.json
}
