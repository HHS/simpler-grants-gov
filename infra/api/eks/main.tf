# EKS cluster layer.
#
# Stands up an EKS cluster ALONGSIDE the existing ECS services, not in place of
# them. Per HHS/simpler-grants-gov#11129 this is an evaluation: run the same
# workloads on EKS in a lower environment, then decide whether to roll forward
# or stay on ECS. Nothing here touches the ECS service, database, or search
# layers, and no existing pipeline deploys to it.
#
# Scope is deliberately the cluster and the capacity to bootstrap it. ArgoCD
# (#11127) and Karpenter (#11128) install on top and are separate tickets; this
# layer produces the IAM, OIDC, and security group outputs they need.
#
# Only infra-dev is configured. The legacy "dev" environment lives in the AWS
# Beta account (315341936575), which is being decommissioned, so a new layer
# should not land there.

data "aws_caller_identity" "current" {}

data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [local.network_config.vpc_name]
  }
}

# Nodes and control plane ENIs go in private subnets. Egress is via the VPC's
# NAT gateways; nothing in the cluster gets a public IP.
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

locals {
  prefix = terraform.workspace == "default" ? "" : "${terraform.workspace}-"

  cluster_name = "${local.prefix}${module.app_config.app_name}-${var.environment_name}"

  environment_config = module.app_config.environment_configs[var.environment_name]
  network_config     = module.project_config.network_configs[local.environment_config.network_name]

  tags = merge(module.project_config.default_tags, {
    owner       = "navapbc"
    app         = module.app_config.app_name
    environment = var.environment_name
    description = "EKS cluster for the ${var.environment_name} environment"
  })
}

terraform {
  required_version = "1.14.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.27.0, < 7.0.0"
    }
    # Reads the OIDC issuer's certificate chain to build the IRSA provider
    # thumbprint.
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = module.project_config.default_region
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

module "expected_account" {
  source       = "../../modules/account-id-by-name"
  account_name = local.network_config.account_name
  accounts_dir = "${path.module}/../../accounts"
}

module "account_guard" {
  source              = "../../modules/aws-account-guard"
  expected_account_id = module.expected_account.account_id
  context             = "the ${var.environment_name} eks cluster"
}

module "eks" {
  source = "../../modules/eks"

  cluster_name       = local.cluster_name
  kubernetes_version = var.kubernetes_version

  vpc_id     = data.aws_vpc.network.id
  subnet_ids = data.aws_subnets.private.ids

  node_instance_types = var.node_instance_types
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size

  # Without at least one entry nobody can reach the cluster:
  # bootstrap_cluster_creator_admin_permissions is false, so whoever ran the
  # first apply gets no standing access either.
  cluster_admin_role_arns = compact([
    var.sso_admin_role_name != null ? "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-reserved/sso.amazonaws.com/${var.sso_admin_role_name}" : null,
    "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${module.project_config.github_actions_role_name}",
  ])
}
