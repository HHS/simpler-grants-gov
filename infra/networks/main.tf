# TODO: This file is is a temporary implementation of the network layer
# that currently just adds resources to the default VPC
# The full network implementation is part of https://github.com/navapbc/template-infra/issues/152

data "aws_region" "current" {}

locals {
  tags = merge(module.project_config.default_tags, {
    description = "VPC resources"
  })
  region = module.project_config.default_region

  # List of AWS services used by this VPC
  # This list is used to create VPC endpoints so that the AWS services can
  # be accessed without network traffic ever leaving the VPC's private network
  # For a list of AWS services that integrate with AWS PrivateLink
  # see https://docs.aws.amazon.com/vpc/latest/privatelink/aws-services-privatelink-support.html
  #
  # The database module requires VPC access from private networks to SSM, KMS, and RDS
  aws_service_integrations = toset(
    module.app_config.has_database ? ["ssm", "kms"] : []
  )
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
  source = "../app/app-config"
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "default-for-az"
    values = [true]
  }
}

# VPC Endpoints for accessing AWS Services
# ----------------------------------------
#
# Since the role manager Lambda function is in the VPC (which is needed to be
# able to access the database) we need to allow the Lambda function to access
# AWS Systems Manager Parameter Store (to fetch the database password) and
# KMS (to decrypt SecureString parameters from Parameter Store). We can do
# this by either allowing internet access to the Lambda, or by using a VPC
# endpoint. The latter is more secure.
# See https://repost.aws/knowledge-center/lambda-vpc-parameter-store
# See https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html#create-interface-endpoint

resource "aws_security_group" "aws_services" {
  count = length(local.aws_service_integrations) > 0 ? 1 : 0

  name_prefix = module.project_config.aws_services_security_group_name_prefix
  description = "VPC endpoints to access AWS services from the VPCs private subnets"
  vpc_id      = data.aws_vpc.default.id
}

resource "aws_vpc_endpoint" "aws_service" {
  for_each = local.aws_service_integrations

  vpc_id              = data.aws_vpc.default.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.${each.key}"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.aws_services[0].id]
  subnet_ids          = data.aws_subnets.default.ids
  private_dns_enabled = true
}
