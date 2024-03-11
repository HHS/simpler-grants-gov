data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_cloudwatch_log_group" "logs" {
  name = "feature-flags/${local.evidently_project_name}"

  # checkov:skip=CKV_AWS_158:Feature flag evaluation logs are not sensitive

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827
}

# Manually create policy allowing AWS services to deliver logs to this log group
# so that the automatically created one by AWS doesn't exceed the character limit
# see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AWS-logs-and-resource-policy.html#AWS-vended-logs-permissions
# see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html#reference_iam-quotas-entity-length
resource "aws_cloudwatch_log_resource_policy" "logs" {
  policy_name     = "/log-delivery/feature-flags/${local.evidently_project_name}-logs"
  policy_document = data.aws_iam_policy_document.logs.json
}

data "aws_iam_policy_document" "logs" {
  statement {
    sid    = "AWSLogDeliveryWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["delivery.logs.amazonaws.com"]
    }
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["${aws_cloudwatch_log_group.logs.arn}:log-stream:*"]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
    }
  }
}
