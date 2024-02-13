# PURPOSE:
# This is a standalone full-load task used for testing purposes.

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dms_replication_task
resource "aws_dms_replication_task" "replication_task_full_load" {
  replication_instance_arn = aws_dms_replication_instance.instance.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source_endpoint.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target_endpoint.endpoint_arn
  migration_type           = "full-load"
  replication_task_id      = "${var.environment_name}-full-load"
  # The following settings are our modifications from the default settings.
  # Terraform will merge these settings with the default settings.
  #
  # Because we don't explicitly specify all ~200 of the default settings,
  # terraform will show a diff that includes all of the default settings.
  # You can safely ignore that diff.
  #
  # Example diff here: https://betagrantsgov.slack.com/archives/C05TSL64VUH/p1707427008889219
  replication_task_settings = jsonencode(
    {
      "Logging" : {
        "EnableLogging" : true,
        "EnableLogContext" : true,
      },
      "FullLoadSettings" : {
        # !IMPORTANT! This setting will delete all data in the target table before loading new data.
        # This should generally not be used in production. It's here for the sake of dev / test environments.
        "TargetTablePrepMode" : "TRUNCATE_BEFORE_LOAD"
      },
    }
  )
  table_mappings = jsonencode(local.dms_table_mappings)
}
