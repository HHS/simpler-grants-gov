data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_iam_policy" "identity_access" {
  name   = "${var.name}-identity-access"
  policy = data.aws_iam_policy_document.identity_access.json
}

data "aws_iam_policy_document" "identity_access" {
  statement {
    actions   = ["cognito-idp:*"]
    effect    = "Allow"
    resources = ["arn:aws:cognito-idp:${data.aws_region.current.name}:${data.aws_caller_identity.current.id}:userpool/${var.user_pool_id}"]
  }
}
