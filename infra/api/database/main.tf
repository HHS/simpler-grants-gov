# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc
data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [module.project_config.network_configs[var.environment_name].vpc_name]
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/subnet
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
    environment = var.environment_name
    description = "Database resources for the ${var.environment_name} environment"
  })

  environment_config = module.app_config.environment_configs[var.environment_name]
  database_config    = local.environment_config.database_config
  opensearch_config  = local.environment_config.opensearch_config
}

terraform {
  required_version = ">=1.4.0"

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

module "opensearch" {
  count = local.opensearch_config != null ? 1 : 0

  source = "../../modules/opensearch"

  name                          = "${local.prefix}${var.environment_name}"
  availability_zone_count       = 3
  zone_awareness_enabled        = var.environment_name == "prod" ? true : false
  multi_az_with_standby_enabled = var.environment_name == "prod" ? true : false
  dedicated_master_enabled      = var.environment_name == "prod" ? true : false
  warm_enabled                  = var.environment_name == "prod" ? true : false
  cold_storage_enabled          = var.environment_name == "prod" ? true : false
  warm_type                     = var.environment_name == "prod" ? local.opensearch_config.warm_type : null
  warm_count                    = var.environment_name == "prod" ? 3 : null
  dedicated_master_count        = var.environment_name == "prod" ? 3 : 1
  instance_count                = var.environment_name == "prod" ? 3 : 1
  subnet_ids                    = slice(data.aws_subnets.database.ids, 0, var.environment_name == "prod" ? 3 : 1)
  cidr_block                    = data.aws_vpc.network.cidr_block
  engine_version                = local.opensearch_config.engine_version
  dedicated_master_type         = local.opensearch_config.dedicated_master_type
  instance_type                 = local.opensearch_config.instance_type
  volume_size                   = local.opensearch_config.volume_size
  vpc_id                        = data.aws_vpc.network.id
}

module "database" {
  source = "../../modules/database"

  name                        = "${local.prefix}${local.database_config.cluster_name}"
  access_policy_name          = "${local.prefix}${local.database_config.access_policy_name}"
  app_access_policy_name      = "${local.prefix}${local.database_config.app_access_policy_name}"
  migrator_access_policy_name = "${local.prefix}${local.database_config.migrator_access_policy_name}"

  # The following are not AWS infra resources and therefore do not need to be
  # isolated via the terraform workspace prefix
  app_username      = local.database_config.app_username
  migrator_username = local.database_config.migrator_username
  schema_name       = local.database_config.schema_name
  instance_count    = local.database_config.instance_count
  max_capacity      = local.database_config.max_capacity
  min_capacity      = local.database_config.min_capacity

  enable_http_endpoint = local.database_config.enable_http_endpoint

  vpc_id                         = data.aws_vpc.network.id
  private_subnet_ids             = data.aws_subnets.database.ids
  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]
  db_subnet_group_name           = var.environment_name
  environment_name               = var.environment_name
  grants_gov_oracle_cidr_block   = module.project_config.network_configs[var.environment_name].grants_gov_oracle_cidr_block
}
