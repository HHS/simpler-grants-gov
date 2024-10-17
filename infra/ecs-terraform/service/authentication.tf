locals {
  extra_policies = {
    "search-deployment" = aws_iam_policy.search_deployment.arn
  }
}

data "aws_iam_policy_document" "search_deployment" {
  statement {
    sid       = "get-ssm-parameters"
    effect    = "Allow"
    actions   = ["ssm:GetParameters"]
    resources = ["arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/search/api-${var.environment_name}/endpoint"]
  }

  statement {
    sid       = "read-s3-objects"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf"]
  }

  statement {
    sid       = "write-s3-objects"
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf/infra/api/opensearch/${var.environment_name}.tfstate"]
  }

  statement {
    sid    = "dynamodb-access"
    effect = "Allow"
    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem"
    ]
    resources = ["arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/simpler-grants-gov-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf-state-locks"]
  }
}

resource "aws_iam_policy" "search_deployment" {
  name        = "search-deployment"
  description = "The policy for deploying our Opensearch configuration"
  policy      = data.aws_iam_policy_document.search_deployment.json
}
