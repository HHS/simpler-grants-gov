# DNS query logging

resource "aws_cloudwatch_log_group" "dns_query_logging" {
  count = var.manage_dns ? 1 : 0

  name              = "/dns/${var.name}"
  retention_in_days = 30

  # checkov:skip=CKV_AWS_158:No need to manage KMS key for DNS query logs or audit access to these logs
}

resource "aws_route53_query_log" "dns_query_logging" {
  count = var.manage_dns ? 1 : 0

  zone_id                  = aws_route53_zone.zone[0].zone_id
  cloudwatch_log_group_arn = aws_cloudwatch_log_group.dns_query_logging[0].arn

  depends_on = [aws_cloudwatch_log_resource_policy.dns_query_logging[0]]
}

# Allow Route53 to write logs to any log group under /dns/*
data "aws_iam_policy_document" "dns_query_logging" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:*:*:log-group:/dns/*"]

    principals {
      identifiers = ["route53.amazonaws.com"]
      type        = "Service"
    }
  }
}

resource "aws_cloudwatch_log_resource_policy" "dns_query_logging" {
  count = var.manage_dns ? 1 : 0

  policy_document = data.aws_iam_policy_document.dns_query_logging.json
  policy_name     = "dns-query-logging"
}
