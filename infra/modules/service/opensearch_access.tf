#--------------------
# OpenSearch Access
#--------------------

# Attach the OpenSearch ingest policy to the opensearch-write role
# This allows scheduled OpenSearch sync jobs to write to OpenSearch
# The app_service role only gets the opensearch_query policy (read-only)
# The migrator role no longer has OpenSearch permissions - it's only for database migrations
resource "aws_iam_role_policy_attachment" "opensearch_write_ingest" {
  count = var.opensearch_ingest_policy_arn != null ? 1 : 0

  role       = aws_iam_role.opensearch_write[0].name
  policy_arn = var.opensearch_ingest_policy_arn
}

resource "aws_iam_role_policy_attachment" "opensearch_write_runtime_logs" {
  count = var.opensearch_ingest_policy_arn != null ? 1 : 0

  role       = aws_iam_role.opensearch_write[0].name
  policy_arn = aws_iam_policy.runtime_logs.arn
}

resource "aws_iam_role_policy_attachment" "opensearch_write_db_access" {
  count = var.opensearch_ingest_policy_arn != null && var.db_vars != null ? 1 : 0

  role       = aws_iam_role.opensearch_write[0].name
  policy_arn = var.db_vars.app_access_policy_arn
}
