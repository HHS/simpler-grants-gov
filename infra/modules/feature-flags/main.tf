locals {
  evidently_project_name = "${var.service_name}-flags"
}

resource "aws_evidently_project" "feature_flags" {
  name        = local.evidently_project_name
  description = "Feature flags for ${var.service_name}"
  data_delivery {
    cloudwatch_logs {
      log_group = aws_cloudwatch_log_group.logs.name
    }
  }
  # Make sure the resource policy is created first so that AWS doesn't try to
  # automatically create one
  depends_on = [aws_cloudwatch_log_resource_policy.logs]
}

resource "aws_evidently_feature" "feature_flag" {
  for_each = var.feature_flags

  name        = each.key
  project     = aws_evidently_project.feature_flags.name
  description = "Enables the ${each.key} feature"
  variations {
    name = "FeatureOff"
    value {
      bool_value = false
    }
  }
  variations {
    name = "FeatureOn"
    value {
      bool_value = true
    }
  }

  # default_variation specifies the variation to use as the default variation.
  # Ignore this in terraform to allow business users to enable a feature for all users.
  #
  # entity_overrides specifies users that should always be served a specific variation of a feature.
  # Ignore this in terraform to allow business users and developers to select feature variations
  # for testing or pilot purposes.
  lifecycle {
    ignore_changes = [
      default_variation,
      entity_overrides,
    ]
  }
}
