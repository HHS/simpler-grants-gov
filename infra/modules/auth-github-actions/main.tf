# Set up GitHub's OpenID Connect provider in AWS account
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  # AWS already trusts the GitHub OIDC identity provider's library of root certificate authorities
  # so no thumbprints from intermediate certificates are needed
  # At the time of writing (July 12, 2023), the thumbprint_list parameter
  # is required to be a non-empty array, so we are passing an array with a dummy string that passes validation
  # TODO(https://github.com/navapbc/template-infra/issues/350) Remove this parameter thumbprint_list is no
  # longer required (see https://github.com/hashicorp/terraform-provider-aws/issues/32480)
  thumbprint_list = ["0000000000000000000000000000000000000000"]
}

# Create IAM role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name               = var.github_actions_role_name
  description        = "Service role required for Github Action to deploy application resources into the account."
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}

# Attach access policies to GitHub Actions role
resource "aws_iam_role_policy_attachment" "custom" {
  count = length(var.iam_role_policy_arns)

  # TODO(https://github.com/navapbc/template-infra/issues/194) Set permissions for GitHub Actions role
  # checkov:skip=CKV_AWS_274:Replace default policy of AdministratorAccess with finer grained permissions

  role       = aws_iam_role.github_actions.name
  policy_arn = var.iam_role_policy_arns[count.index]
}

# Set up assume role policy for GitHub Actions to allow GitHub actions
# running from the specified repository and branches/git refs to assume
# the role
data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:*"]
    }
  }
}
