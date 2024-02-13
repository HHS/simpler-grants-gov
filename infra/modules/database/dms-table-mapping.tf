locals {
  dms_table_mappings = {
    "rules" : [
      {
        "rule-type" : "selection",
        "rule-id" : "1",
        "rule-name" : "Include TOPPORTUNITY table",
        "object-locator" : {
          "schema-name" : "EGRANTSADMIN",
          "table-name" : "TOPPORTUNITY"
        },
        "rule-action" : "include",
        "filters" : [{
          "filter-type" : "source",
          "column-name" : "IS_DRAFT",
          "filter-conditions" : [{
            "filter-operator" : "eq",
            "value" : "N"
          }]
        }]
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
        "value" : "api"
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
      {
        "rule-type" : "transformation",
        "rule-id" : "8",
        "rule-name" : "add time",
        "rule-target" : "column",
        "object-locator" : {
          "schema-name" : "EGRANTSADMIN",
          "table-name" : "TOPPORTUNITY"
        },
        "rule-action" : "add-column",
        "value" : "created_at",
        "expression" : "datetime ()",
        "data-type" : {
          "type" : "datetime",
          "precision" : 6
        }
      },
      {
        "rule-type" : "transformation",
        "rule-id" : "9",
        "rule-name" : "add time",
        "rule-target" : "column",
        "object-locator" : {
          "schema-name" : "EGRANTSADMIN",
          "table-name" : "TOPPORTUNITY"
        },
        "rule-action" : "add-column",
        "value" : "updated_at",
        "expression" : "datetime ()",
        "data-type" : {
          "type" : "datetime",
          "precision" : 6
        }
      }
    ]
  }
}
