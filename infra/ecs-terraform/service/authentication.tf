locals {
  extra_policies = {
    "search-deployment" = aws_iam_policy.search_deployment.arn
  }
}

data "aws_iam_policy_document" "search_deployment" {
  statement {
    effect    = "Allow"
    actions   = ["ec2:Describe*"]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "search_deployment" {
  name        = "search-deployment"
  description = "The policy for deploying our Opensearch configuration"
  policy      = data.aws_iam_policy_document.search_deployment.json
}
