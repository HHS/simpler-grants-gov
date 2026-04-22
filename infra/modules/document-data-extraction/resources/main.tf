locals {
  # convert standard terraform tags to bedrock data automation format
  bda_tags = [
    for key, value in var.tags : {
      key   = key
      value = value
    }
  ]

  blueprint_arns = [
    for bp in var.blueprints : bp
    if startswith(bp, "arn:")
  ]

  blueprint_files = [
    for bp in var.blueprints : bp
    if !startswith(bp, "arn:")
  ]

  # create map of custom blueprints from files
  custom_blueprints_map = {
    for file_path in local.blueprint_files :
    replace(basename(file_path), ".json", "") => {
      schema = file(file_path)
      type   = "DOCUMENT"
      tags   = var.tags
    }
  }

  all_blueprints = concat(
    # custom blueprints created from json schemas
    [for k, v in awscc_bedrock_blueprint.bda_blueprint : {
      blueprint_arn   = v.blueprint_arn
      blueprint_stage = v.blueprint_stage
    }],
    # aws managed blueprints referenced by arn
    length(local.blueprint_arns) > 0 ? [
      for arn in local.blueprint_arns : {
        blueprint_arn   = arn
        blueprint_stage = "LIVE"
      }
    ] : []
  )
}

resource "awscc_bedrock_data_automation_project" "bda_project" {
  project_name                  = "${var.name}-project"
  project_description           = "Project for ${var.name}"
  tags                          = local.bda_tags
  standard_output_configuration = var.standard_output_configuration
  custom_output_configuration = length(local.all_blueprints) > 0 ? {
    blueprints = local.all_blueprints
  } : null
  override_configuration = var.override_configuration
}

resource "awscc_bedrock_blueprint" "bda_blueprint" {
  for_each = local.custom_blueprints_map

  blueprint_name = "${var.name}-${each.key}"
  schema         = each.value.schema
  type           = each.value.type
  tags           = local.bda_tags
}
