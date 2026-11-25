module "network" {
  source       = "../../modules/network/data"
  name         = local.environment_config.network_name
  project_name = module.project_config.project_name
}

data "aws_security_groups" "aws_services" {
  filter {
    name   = "group-name"
    values = ["${module.project_config.aws_services_security_group_name_prefix}*"]
  }

  filter {
    name   = "vpc-id"
    values = [module.network.vpc_id]
  }
}

# The frontend reads content from Drupal's JSON:API, so its tasks may reach Drupal.
data "aws_security_groups" "frontend" {
  filter {
    name   = "group-name"
    values = ["frontend-${var.environment_name}-app*"]
  }

  filter {
    name   = "vpc-id"
    values = [module.network.vpc_id]
  }
}

locals {
  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    app         = module.app_config.app_name
    environment = var.environment_name
    description = "Application resources created in ${var.environment_name} environment"
  })

  environment_config = module.app_config.environment_configs[var.environment_name]
  service_config     = local.environment_config.service_config
  vpn_config         = local.environment_config.vpn_config

  network_config = module.project_config.network_configs[local.environment_config.network_name]
}

terraform {
  required_version = "1.17.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.27.0, < 7.0.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region              = local.service_config.region
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

# Resolve the account this environment must deploy to
module "expected_account" {
  source       = "../../modules/account-id-by-name"
  account_name = local.network_config.account_name
  accounts_dir = "${path.module}/../../accounts"
}

module "account_guard" {
  source              = "../../modules/aws-account-guard"
  expected_account_id = module.expected_account.account_id
  context             = "the ${var.environment_name} cms service"
}

data "aws_acm_certificate" "certificate" {
  count       = local.service_config.enable_https ? 1 : 0
  domain      = local.service_config.domain_name
  key_types   = ["RSA_4096", "RSA_2048"]
  most_recent = true
}

# Drupal has no public access. Its own ECS cluster and service sit behind an internal
# load balancer that only the frontend and VPN users can reach, and domain_name
# resolves to that load balancer through a private hosted zone in the VPC.
module "service" {
  source               = "../../modules/service"
  service_name         = local.service_config.service_name
  environment_name     = var.environment_name
  image_repository_url = module.app_config.build_repository_config.repository_url
  image_repository_arn = module.app_config.build_repository_config.repository_arn
  image_tag            = local.image_tag
  network_name         = local.environment_config.network_name
  project_name         = module.project_config.project_name
  fargate_cpu          = local.service_config.cpu
  fargate_memory       = local.service_config.memory
  container_port       = 8000
  healthcheck_path     = "/health"

  desired_instance_count   = local.service_config.desired_instance_count
  enable_command_execution = local.service_config.enable_command_execution

  load_balancer_mode = "private"
  domain_name        = local.service_config.domain_name
  certificate_arn    = local.service_config.enable_https ? data.aws_acm_certificate.certificate[0].arn : null

  internal_alb_ingress_security_group_ids = {
    frontend = one(data.aws_security_groups.frontend.ids)
    vpn      = aws_security_group.vpn.id
  }

  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]

  extra_environment_variables = {
    ENVIRONMENT = var.environment_name
  }

  secrets = [{
    name      = "DRUPAL_HASH_SALT"
    valueFrom = module.drupal_hash_salt.secret_arn
  }]

  is_temporary = false
}

# Drupal uses the hash salt for one-time login links, form tokens and other
# security tokens. It is generated once per environment and kept in Parameter Store.
module "drupal_hash_salt" {
  source            = "../../modules/secret"
  manage_method     = "generated"
  secret_store_name = "/cms/${var.environment_name}/drupal-hash-salt"
}
