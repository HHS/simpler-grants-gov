# Put IAM Roles here

resource "aws_iam_policy" "dms_access" {
  name   = "DMS Access"
  policy = data.aws_iam_policy_document.dms_access.json
}
resource "aws_iam_role" "dms_access" {
  name               = "dms-access-role"
  assume_role_policy = data.aws_iam_policy_document.dms-assume-role-policy.json
}
data "aws_iam_policy_document" "dms-assume-role-policy" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      identifiers = ["dms.amazonaws.com"]
      type        = "Service"
    }
  }
}

# Attach access policies to role
resource "aws_iam_role_policy_attachment" "dms_access" {
  role       = aws_iam_role.dms_access.name
  policy_arn = aws_iam_policy.dms_access.arn
}

# Rough draft of IAM policies
data "aws_iam_policy_document" "dms_access" {
  statement {
    sid       = "AllowDMSAccess"
    effect    = "Allow"
    actions   = ["dms:*"] # TODO: try to narrow this down from dms:*
    resources = [""]      # arn for the actual dms service goes here
  }

  statement {
    # Allows DMS to create the roles it needs if not created beforehand 
    sid    = "AllowCreateIAM"
    effect = "Allow"
    actions = [
      "iam:GetRole",
      "iam:PassRole",
      "iam:CreateRole",
      "iam:AttachRolePolicy"
    ]
    resources = [""] # DMS arn here
  }
  statement {
    # Allow DMS to configure the network it needs
    sid    = "EC2Access"
    effect = "Allow"
    actions = [
      "ec2:DescribeVpcs",
      "ec2:DescribeInternetGateways",
      "ec2:DescribeAvailabilityZones",
      "ec2:DescribeSubnets",
      "ec2:DescribeSecurityGroups",
      "ec2:ModifyNetworkInterfaceAttribute",
      "ec2:CreateNetworkInterface",
      "ec2:DeleteNetworkInterface"
    ]
    resources = [""] # DMS or EC2 arn?
  }
  statement {
    # View replication metrics
    sid       = "AllowCloudwatchMetrics"
    effect    = "Allow"
    actions   = ["cloudwatch:Get*", "cloudwatch:List*"]
    resources = [""]
  }
  statement {
    # View replication logs
    sid    = "AllowCloudwatchLogs"
    effect = "Allow"
    actions = [
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:ilterLogEvents",
      "logs:GetLogEvents"
    ]
    resources = [""] # DMS arn
  }
}
