# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dms_replication_task
resource "aws_dms_replication_task" "task" {
  replication_instance_arn = aws_dms_replication_instance.instance.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source_endpoint.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target_endpoint.endpoint_arn
  migration_type           = "full-load"
  replication_task_id      = "${var.environment_name}-task"
  replication_task_settings = jsonencode(
    {
      "Logging" : {
        "EnableLogging" : true,
        "EnableLogContext" : true,
        "LogComponents" : [
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "TRANSFORMATION"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "SOURCE_UNLOAD"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "IO"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "TARGET_LOAD"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "PERFORMANCE"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "SOURCE_CAPTURE"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "SORTER"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "REST_SERVER"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "VALIDATOR_EXT"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "TARGET_APPLY"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "TASK_MANAGER"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "TABLES_MANAGER"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "METADATA_MANAGER"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "FILE_FACTORY"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "COMMON"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "ADDONS"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "DATA_STRUCTURE"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "COMMUNICATION"
          },
          {
            "Severity" : "LOGGER_SEVERITY_DETAILED_DEBUG",
            "Id" : "FILE_TRANSFER"
          }
        ],
      },
      "ValidationSettings" : {
        "EnableValidation" : true,
      },
      # "FullLoadSettings" : {
      #   "TargetTablePrepMode" : "DO_NOTHING"
      # },
    }
  )
  table_mappings = jsonencode(
    {
      "rules" : [
        {
          "rule-type" : "selection",
          "rule-id" : "1",
          "rule-name" : "Include TOPPORTUNITY table",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY"
          },
          "rule-action" : "explicit"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "2",
          "rule-name" : "Rename schema",
          "rule-action" : "rename",
          "rule-target" : "schema",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN"
          },
          "value" : "public"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "3",
          "rule-name" : "Rename table TOPPORTUNITY to transfer_topportunity",
          "rule-action" : "rename",
          "rule-target" : "table",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY"
          },
          "value" : "transfer_topportunity"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "4",
          "rule-name" : "Lowercase column names",
          "rule-action" : "convert-lowercase",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "%",
            "table-name" : "%",
            "column-name" : "%",
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "5",
          "rule-name" : "Exclude column TOPPORTUNITY.LISTED",
          "rule-action" : "remove-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "LISTED"
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "6",
          "rule-name" : "Exclude column TOPPORTUNITY.INITIAL_OPPORTUNITY_ID",
          "rule-action" : "remove-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "INITIAL_OPPORTUNITY_ID"
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "7",
          "rule-name" : "Exclude column TOPPORTUNITY.FLAG_2006",
          "rule-action" : "remove-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "FLAG_2006"
          }
        },
      ]
    }
  )
}
