data "aws_region" "current" {}

locals {
  tags = merge(module.project_config.default_tags, {
    network_name = var.network_name
    description  = "VPC resources"
  })
  region = module.project_config.default_region

  network_config = module.project_config.network_configs[var.network_name]
  domain_config  = local.network_config.domain_config

  # List of configuration for all applications, even ones that are not in the current network
  # If project has multiple applications, add other app configs to this list
  app_configs = []

  # List of configuration for applications that are in the current network
  # An application is in the current network if at least one of its environments
  # is mapped to the network
  apps_in_network = [
    for app in local.app_configs :
    app
    if anytrue([
      for environment_config in app.environment_configs : true if environment_config.network_name == var.network_name
    ])
  ]

  # Whether any of the applications in the network have a database
  has_database = anytrue([for app in local.apps_in_network : app.has_database])

  # Whether any of the applications in the network have dependencies on an external non-AWS service
  has_external_non_aws_service = anytrue([for app in local.apps_in_network : app.has_external_non_aws_service])

  # Whether any of the applications in the network has an environment that needs container execution access
  enable_command_execution = anytrue([
    for app in local.apps_in_network :
    anytrue([
      for environment_config in app.environment_configs : true if environment_config.service_config.enable_command_execution == true && environment_config.network_name == var.network_name
    ])
  ])

  # Whether any of the applications in the network has enabled notifications
  enable_notifications = anytrue([for app in local.apps_in_network : app.enable_notifications])

  # Whether any of the applications in the network has enabled SMS notifications
  enable_sms_notifications = anytrue([for app in local.apps_in_network : app.enable_sms_notifications])
}

terraform {
  required_version = "~>1.10.0"

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
  region = local.region
  default_tags {
    tags = local.tags
  }
}

provider "aws" {
  alias  = "us-east-1"
  region = "us-east-1"

  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../project-config"
}

module "network" {
  source                       = "../modules/network/resources"
  name                         = var.network_name
  has_database                 = local.has_database
  has_external_non_aws_service = local.has_external_non_aws_service
  enable_command_execution     = local.enable_command_execution
  enable_notifications         = local.enable_notifications
}

module "domain" {
  source = "../modules/domain/resources"
  providers = {
    aws           = aws
    aws.us-east-1 = aws.us-east-1
  }

  name                = local.domain_config.hosted_zone
  manage_dns          = local.domain_config.manage_dns
  certificate_configs = local.domain_config.certificate_configs
}
