data "aws_iam_role" "github_actions" {
  name = module.project_config.github_actions_role_name
}

locals {
  # Set project tags that will be used to tag all resources.
  tags = merge(module.project_config.default_tags, {
    application      = module.app_config.app_name
    application_role = "build-repository"
    description      = "Backend resources required for storing built release candidate artifacts to be used for deploying to environments."
  })

  # Get list of AWS account ids for the application environments that
  # will need access to the build repository
  app_account_names   = values(module.app_config.account_names_by_environment)
  account_ids_by_name = data.external.account_ids_by_name.result
  app_account_ids     = [for account_name in local.app_account_names : local.account_ids_by_name[account_name] if contains(keys(local.account_ids_by_name), account_name)]
}

terraform {
  required_version = "< 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.68.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = module.app_config.build_repository_config.region
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

data "external" "account_ids_by_name" {
  program = ["../../../bin/account-ids-by-name"]
}

module "container_image_repository" {
  source               = "../../modules/container-image-repository"
  name                 = module.app_config.image_repository_name
  push_access_role_arn = data.aws_iam_role.github_actions.arn
  app_account_ids      = local.app_account_ids
}
