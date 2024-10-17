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

data "aws_caller_identity" "current" {}

module "project_config" {
  source = "../../project-config"
}

data "aws_ssm_parameter" "search_endpoint_arn" {
  name = "/search/api-${var.environment_name}/endpoint"
}

provider "opensearch" {
  url = data.aws_ssm_parameter.search_endpoint_arn.value
}

resource "opensearch_role" "admin" {
  role_name   = "admin"
  description = "admin test"

  cluster_permissions = ["*"]

  index_permissions {
    index_patterns  = ["*"]
    allowed_actions = ["*"]
  }

  tenant_permissions {
    tenant_patterns = ["*"]
    allowed_actions = ["*"]
  }
}

resource "opensearch_roles_mapping" "admin" {
  role_name   = "logs_writer"
  description = "Mapping AWS IAM roles to ES role"
  backend_roles = [
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/api-${var.environment_name}-app"
  ]
}
