# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc
data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [module.project_config.network_configs[var.environment_name].vpc_name]
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/subnet
data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["private"]
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/subnet
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["public"]
  }
}

locals {
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    environment = var.environment_name
    description = "Application resources created in ${var.environment_name} environment"
  })

  service_name = "metabase-${var.environment_name}"

  is_temporary = startswith(terraform.workspace, "t-")

  environment_config = module.app_config.environment_configs[var.environment_name]
  service_config     = local.environment_config.service_config
  database_config    = local.environment_config.database_config
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
  region = local.service_config.region
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

data "aws_rds_cluster" "db_cluster" {
  cluster_identifier = local.database_config.cluster_name
}

module "service" {
  source                   = "../../modules/service"
  service_name             = local.service_name
  image_repository_url     = "docker.io/metabase/metabase-enterprise" # https://hub.docker.com/r/metabase/metabase
  image_tag                = local.image_tag
  vpc_id                   = data.aws_vpc.network.id
  public_subnet_ids        = data.aws_subnets.public.ids
  private_subnet_ids       = data.aws_subnets.private.ids
  cpu                      = 1024
  memory                   = 2048
  container_port           = 3000
  readonly_root_filesystem = false
  drop_linux_capabilities  = false
  healthcheck_command      = null
  healthcheck_path         = "/"

  extra_environment_variables = merge(local.service_config.extra_environment_variables, {
    ENVIRONMENT = var.environment_name
    MB_DB_PORT  = data.aws_rds_cluster.db_cluster.port
    MB_DB_HOST  = data.aws_rds_cluster.db_cluster.endpoint
  })

  secrets = concat(
    [for secret_name in keys(local.service_config.secrets) : {
      name      = secret_name
      valueFrom = module.secrets[secret_name].secret_arn
    }],
  )

  app_access_policy_arn      = null
  migrator_access_policy_arn = null

  db_vars = {
    security_group_ids = data.aws_rds_cluster.db_cluster.vpc_security_group_ids
    connection_info = {
      host        = data.aws_rds_cluster.db_cluster.endpoint
      port        = data.aws_rds_cluster.db_cluster.port
      user        = local.database_config.app_username
      db_name     = data.aws_rds_cluster.db_cluster.database_name
      schema_name = local.database_config.schema_name
    }
  }

  is_temporary = false
}
