data "aws_region" "current" {}

locals {
  tags = merge(module.project_config.default_tags, {
    description = "VPC resources"
  })
  region = module.project_config.default_region
}

terraform {
  required_version = ">= 1.2.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~>5.6.0"
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
  aws_services_security_group_name_prefix = var.environment_name
}

module "dms_networking" {
  source = "../modules/dms-networking"
  vpc_id = module.network.vpc_id
}

