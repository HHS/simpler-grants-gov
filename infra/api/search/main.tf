locals {
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = var.environment_name
    description = "Application resources created in ${var.environment_name} environment"
  })
}

terraform {
  required_providers {
    opensearch = {
      source  = "opensearch-project/opensearch"
      version = "2.3.1"
    }
  }
}

module "project_config" {
  source = "../../project-config"
}

data "aws_ssm_parameter" "search_endpoint_arn" {
  name = "/search/api-${var.environment_name}/endpoint"
}

provider "opensearch" {
  url = data.aws_ssm_parameter.search_endpoint_arn.value
}
