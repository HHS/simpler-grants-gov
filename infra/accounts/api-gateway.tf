# In order to enable API gateway logging, we need to create an IAM role that API gateway
# can assume, which is done at the account level

resource "aws_api_gateway_account" "api_gateway_account_level_settings" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_logging.arn
}

data "aws_iam_policy_document" "api_gateway_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "api_gateway_cloudwatch_logging" {
  name               = "api_gateway_service_cloudwatch_logging_role"
  assume_role_policy = data.aws_iam_policy_document.api_gateway_assume_role.json
}

data "aws_iam_policy_document" "api_gateway_cloudwatch_permissions" {
  # checkov:skip=CKV_AWS_356: This is an in-line policy, and only API gateway can assume the role
  # checkov:skip=CKV_AWS_111: This is an in-line policy, and only API gateway can assume the role
  statement {
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents",
    ]

    resources = ["*"]
  }
}
resource "aws_iam_role_policy" "api_gateway_cloudwatch_policy" {
  name   = "cloudwatch_log_permissions"
  role   = aws_iam_role.api_gateway_cloudwatch_logging.id
  policy = data.aws_iam_policy_document.api_gateway_cloudwatch_permissions.json
}
