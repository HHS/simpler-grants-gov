locals {
  # The prefix key/value pair is used for Terraform Workspaces, which is useful for projects with multiple infrastructure developers.
  # By default, Terraform creates a workspace named “default.” If a non-default workspace is not created this prefix will equal “default”,
  # if you choose not to use workspaces set this value to "dev"
  prefix = terraform.workspace == "default" ? "" : "${terraform.workspace}-"

  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    owner       = "navapbc"
    app         = module.app_config.app_name
    environment = var.environment_name
    description = "Database resources for the ${var.environment_name} environment"
  })

  is_temporary = terraform.workspace != "default"

  environment_config = module.app_config.environment_configs[var.environment_name]
  database_config    = local.environment_config.database_config
}

terraform {
  required_version = "1.14.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.13.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = local.database_config.region
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../../project-config"
}

module "app_config" {
  source = "../app-config"
}

module "database" {
  source = "../../modules/database/resources"

  name         = "${local.prefix}${local.database_config.cluster_name}"
  network_name = local.environment_config.network_name
  project_name = module.project_config.project_name
  is_temporary = local.is_temporary
}
