# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/dms_replication_task
resource "aws_dms_replication_task" "task" {
  replication_instance_arn = aws_dms_replication_instance.instance.replication_instance_arn
  source_endpoint_arn      = aws_dms_endpoint.source_endpoint.endpoint_arn
  target_endpoint_arn      = aws_dms_endpoint.target_endpoint.endpoint_arn
  migration_type           = "full-load"
  replication_task_id      = "${var.environment_name}-dms-replication-task"
  replication_task_settings = jsonencode(
    {
      "Logging" : {
        "EnableLogging" : true,
        "EnableLogContext" : true,
      },
    }
  )
  table_mappings = jsonencode(
    {
      "rules" : [
        {
          "rule-type" : "transformation",
          "rule-id" : "1",
          "rule-name" : "Rename schema",
          "rule-action" : "rename",
          "rule-target" : "schema",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN"
          },
          "value" : "public"
        },
        {
          "rule-type" : "selection",
          "rule-id" : "2",
          "rule-name" : "Include TOPPORTUNITY table",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY"
          },
          "rule-action" : "explicit"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "3",
          "rule-name" : "Rename table TOPPORTUNITY to opportunity",
          "rule-action" : "rename",
          "rule-target" : "table",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY"
          },
          "value" : "opportunity"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "4",
          "rule-name" : "Rename OPPNUMBER to opportunity_number",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "OPPNUMBER"
          },
          "value" : "opportunity_number"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "5",
          "rule-name" : "Rename OPPTITLE to opportunity_title",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "OPPTITLE"
          },
          "value" : "opportunity_title"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "6",
          "rule-name" : "Rename OWNINGAGENCY to agency",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "OWNINGAGENCY"
          },
          "value" : "agency"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "7",
          "rule-name" : "Rename OPPCATEGORY to category",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "OPPCATEGORY"
          },
          "value" : "category"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "8",
          "rule-name" : "Rename+convert boolean IS_DRAFT to is_draft",
          "rule-action" : "add-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY"
          },
          "value" : "is_draft",
          "expression" : "CASE WHEN $IS_DRAFT 'Y' THEN 1 WHEN $IS_DRAFT 'N' THEN 0 ELSE null END",
          "data-type" : {
            "type" : "boolean"
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "9",
          "rule-name" : "Remove renamed column IS_DRAFT",
          "rule-action" : "remove-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "IS_DRAFT"
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "10",
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
          "rule-id" : "11",
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
          "rule-id" : "12",
          "rule-name" : "Exclude column TOPPORTUNITY.FLAG_2006",
          "rule-action" : "remove-column",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "FLAG_2006"
          }
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "13",
          "rule-name" : "Rename LAST_UPD_DATE to updated_at",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "LAST_UPD_DATE"
          },
          "value" : "updated_at"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "14",
          "rule-name" : "Rename CREATED_DATE to created_at",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "CREATED_DATE"
          },
          "value" : "created_at"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "15",
          "rule-name" : "Rename REVISION_NUMBER to revision_number",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "REVISION_NUMBER"
          },
          "value" : "revision_number"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "16",
          "rule-name" : "Rename PUBLISHER_PROFILE_ID to publisher_profile_id",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "PUBLISHER_PROFILE_ID"
          },
          "value" : "publisher_profile_id"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "17",
          "rule-name" : "Rename PUBLISHERUID to publisheruid",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "PUBLISHERUID"
          },
          "value" : "publisheruid"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "18",
          "rule-name" : "Rename OPPORTUNITY_ID to opportunity_id",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "OPPORTUNITY_ID"
          },
          "value" : "opportunity_id"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "19",
          "rule-name" : "Rename MODIFIED_COMMENTS to modified_comments",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "MODIFIED_COMMENTS"
          },
          "value" : "modified_comments"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "20",
          "rule-name" : "Rename LAST_UPD_ID to last_upd_id",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "LAST_UPD_ID"
          },
          "value" : "last_upd_id"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "21",
          "rule-name" : "Rename CREATOR_ID to creator_id",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "CREATOR_ID"
          },
          "value" : "creator_id"
        },
        {
          "rule-type" : "transformation",
          "rule-id" : "22",
          "rule-name" : "Rename CATEGORY_EXPLANATION to category_explanation",
          "rule-action" : "rename",
          "rule-target" : "column",
          "object-locator" : {
            "schema-name" : "EGRANTSADMIN",
            "table-name" : "TOPPORTUNITY",
            "column-name" : "CATEGORY_EXPLANATION"
          },
          "value" : "category_explanation"
        }
      ]
    }
  )
}
