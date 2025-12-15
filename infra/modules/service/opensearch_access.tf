#--------------------
# OpenSearch Access
#--------------------

# Attach the OpenSearch ingest policy to the migrator role only
# This allows scheduled jobs to write to OpenSearch
# Scheduled jobs use the migrator task definition which uses the migrator_task role
# The app_service role only gets the opensearch_query policy (read-only)
resource "aws_iam_role_policy_attachment" "migrator_opensearch_ingest" {
  count = var.opensearch_ingest_policy_arn != null && var.db_vars != null ? 1 : 0

  role       = aws_iam_role.migrator_task[0].name
  policy_arn = var.opensearch_ingest_policy_arn
}
