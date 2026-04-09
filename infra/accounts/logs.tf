# docs: https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutResourcePolicy.html
# only 10 of these are allowed per region, so we deploy 1 per account

resource "aws_cloudwatch_log_resource_policy" "policy" {
  policy_name     = "account-level-logs"
  policy_document = data.aws_iam_policy_document.policy.json
}

data "aws_iam_policy_document" "policy" {
  statement {
    effect = "Allow"
    principals {
      identifiers = [
        # docs: https://docs.aws.amazon.com/opensearch-service/latest/developerguide/createdomain-configure-slow-logs.html
        "es.amazonaws.com",
        # docs: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/AWS-logs-and-resource-policy.html
        "delivery.logs.amazonaws.com"
      ]
      type = "Service"
    }
    actions = [
      "logs:PutLogEvents",
      "logs:PutLogEventsBatch",
      "logs:CreateLogStream",
    ]
    resources = ["arn:aws:logs:*"]
  }
}
