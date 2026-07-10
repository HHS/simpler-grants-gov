mock_provider "aws" {}

variables {
  service_name = "grants-api"
  feature_flags = {
    "enable-search" = "true"
    "max-results"   = "100"
  }
}

run "creates_one_ssm_parameter_per_flag" {
  command = plan

  assert {
    condition     = length(aws_ssm_parameter.feature_flags) == length(var.feature_flags)
    error_message = "One SSM parameter should be created per feature flag"
  }
}

run "ssm_parameter_path_uses_service_and_key" {
  command = plan

  assert {
    condition     = aws_ssm_parameter.feature_flags["enable-search"].name == "/service/${var.service_name}/feature-flag/enable-search"
    error_message = "SSM parameter path must follow /service/{service_name}/feature-flag/{key} format"
  }
}

run "ssm_parameter_type_is_string" {
  command = plan

  assert {
    condition     = aws_ssm_parameter.feature_flags["enable-search"].type == "String"
    error_message = "Feature flag SSM parameter type must be String"
  }

  assert {
    condition     = aws_ssm_parameter.feature_flags["max-results"].type == "String"
    error_message = "Feature flag SSM parameter type must be String"
  }
}

run "ssm_parameter_stores_provided_value" {
  command = plan

  assert {
    condition     = aws_ssm_parameter.feature_flags["enable-search"].value == var.feature_flags["enable-search"]
    error_message = "SSM parameter value should match the provided feature flag value"
  }
}

run "output_map_has_entry_for_each_flag" {
  command = plan

  assert {
    condition     = length(output.ssm_parameter_arns) == length(var.feature_flags)
    error_message = "Output ssm_parameter_arns should contain one entry per feature flag"
  }
}
