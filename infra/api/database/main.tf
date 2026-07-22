data "aws_caller_identity" "current" {}

data "aws_vpc" "network" {
  filter {
    name = "tag:Name"
    # Resolve the VPC by the environment's network_name so the environment name
    # and its VPC/network name may differ (e.g. infra-dev -> infra-dev-simpler-grants).
    values = [local.network_config.vpc_name]
  }
}

data "aws_subnets" "database" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["database"]
  }
}

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

  environment_config = module.app_config.environment_configs[var.environment_name]
  database_config    = local.environment_config.database_config
  network_config     = module.project_config.network_configs[local.environment_config.network_name]
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
  # Refuse to operate against the wrong account (covers plan/apply/destroy).
  allowed_account_ids = [module.expected_account.account_id]
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

# Resolve the account this environment must deploy to (used by the provider's
# allowed_account_ids below and by the guard), then short-circuit plan/apply if
# the active AWS credentials are for a different account.
module "expected_account" {
  source       = "../../modules/account-id-by-name"
  account_name = local.network_config.account_name
  accounts_dir = "${path.module}/../../accounts"
}

module "account_guard" {
  source              = "../../modules/aws-account-guard"
  expected_account_id = module.expected_account.account_id
  context             = "the ${var.environment_name} api database"
}

data "aws_security_groups" "aws_services" {
  filter {
    name   = "group-name"
    values = ["${module.project_config.aws_services_security_group_name_prefix}*"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
}

module "database" {
  source = "../../modules/database"

  name                        = "${local.prefix}${local.database_config.cluster_name}"
  app_access_policy_name      = "${local.prefix}${local.database_config.app_access_policy_name}"
  migrator_access_policy_name = "${local.prefix}${local.database_config.migrator_access_policy_name}"
  # The following are not AWS infra resources and therefore do not need to be
  # isolated via the terraform workspace prefix
  app_username                   = local.database_config.app_username
  migrator_username              = local.database_config.migrator_username
  schema_name                    = local.database_config.schema_name
  instance_count                 = local.database_config.instance_count
  max_capacity                   = local.database_config.max_capacity
  min_capacity                   = local.database_config.min_capacity
  enable_http_endpoint           = local.database_config.enable_http_endpoint
  engine_version                 = local.database_config.database_engine_version
  vpc_id                         = data.aws_vpc.network.id
  private_subnet_ids             = data.aws_subnets.database.ids
  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]
  # The DB subnet group is created by the networks layer under the network's name,
  # so reference it by network_name (not environment_name).
  database_subnet_group_name   = local.environment_config.network_name
  environment_name             = var.environment_name
  grants_gov_oracle_cidr_block = local.network_config.grants_gov_oracle_cidr_block
  newrelic_entity_guid         = local.database_config.newrelic_entity_guid
  deletion_protection          = local.database_config.deletion_protection
  snapshot_identifier          = var.database_snapshot_id
}
