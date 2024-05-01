data "aws_region" "current" {}

locals {
  tags = merge(module.project_config.default_tags, {
    description = "VPC resources"
  })
  region = module.project_config.default_region
}

terraform {
  required_version = ">= 1.7.0, < 1.8.5" # Pinning to 1.8.2 because that is the latest version as of 5/1/24

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.34.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = local.region
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../project-config"
}

module "app_config" {
  source = "../api/app-config"
}

module "network" {
  source                                  = "../modules/network"
  name                                    = var.environment_name
  database_subnet_group_name              = var.environment_name
  aws_services_security_group_name_prefix = module.project_config.aws_services_security_group_name_prefix
  second_octet                            = module.project_config.network_configs[var.environment_name].second_octet
}

module "dms_networking" {
  source                       = "../modules/dms-networking"
  environment_name             = var.environment_name
  our_vpc_id                   = module.network.vpc_id
  our_cidr_block               = module.network.vpc_cidr
  grants_gov_oracle_cidr_block = module.project_config.network_configs[var.environment_name].grants_gov_oracle_cidr_block
}
