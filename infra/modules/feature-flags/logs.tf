resource "aws_cloudwatch_log_group" "logs" {
  name = "feature-flags/${local.evidently_project_name}"

  # checkov:skip=CKV_AWS_158:Feature flag evaluation logs are not sensitive

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827
}
