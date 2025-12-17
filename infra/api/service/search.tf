locals {
  search_config = local.environment_config.search_config
}

# Endpoint SSM parameter
data "aws_ssm_parameter" "search_endpoint_arn" {
  count = local.search_config != null ? 1 : 0
  name  = "/search/${local.service_name}/endpoint"
}

# IAM policies for OpenSearch access
data "aws_iam_policy" "opensearch_ingest" {
  count = local.search_config != null ? 1 : 0
  name  = "${local.service_name}-opensearch-ingest"
}

data "aws_iam_policy" "opensearch_query" {
  count = local.search_config != null ? 1 : 0
  name  = "${local.service_name}-opensearch-query"
}
