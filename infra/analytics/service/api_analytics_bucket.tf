locals {
  api_analytics_bucket_environment_variables = {
    "API_ANALYTICS_BUCKET" : "s3://${data.aws_ssm_parameter.api_analytics_bucket_id.value}"
  }
}

data "aws_ssm_parameter" "api_analytics_bucket_arn" {
  name = "/buckets/api-${var.environment_name}/api-analytics-transfer/arn"
}

data "aws_ssm_parameter" "api_analytics_bucket_id" {
  name = "/buckets/api-${var.environment_name}/api-analytics-transfer/id"
}

data "aws_iam_policy_document" "api_analytics_bucket_access" {
  statement {
    effect = "Allow"
    resources = [
      data.aws_ssm_parameter.api_analytics_bucket_arn.value,
      "${data.aws_ssm_parameter.api_analytics_bucket_arn.value}/*",
    ]
    actions = ["s3:Get*", "s3:List*"]

    principals {
      type        = "AWS"
      identifiers = [module.service.app_service_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "api_analytics_bucket_access" {
  bucket = data.aws_ssm_parameter.api_analytics_bucket_id.value
  policy = data.aws_iam_policy_document.api_analytics_bucket_access.json
}
