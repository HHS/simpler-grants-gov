data "aws_vpc" "network" {
  tags = {
    project      = module.project_config.project_name
    network_name = local.environment_config.network_name
  }
}

data "aws_subnets" "public" {
  tags = {
    project      = module.project_config.project_name
    network_name = local.environment_config.network_name
    subnet_type  = "public"
  }
}

data "aws_subnets" "private" {
  tags = {
    project      = module.project_config.project_name
    network_name = local.environment_config.network_name
    subnet_type  = "private"
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
    description = "Application resources created in ${var.environment_name} environment"
  })

  service_name = "${local.prefix}${module.app_config.app_name}-${var.environment_name}"

  # Include project name in bucket name since buckets need to be globally unique across AWS
  bucket_name = "${local.prefix}${module.project_config.project_name}-${module.app_config.app_name}-${var.environment_name}"

  environment_config                             = module.app_config.environment_configs[var.environment_name]
  service_config                                 = local.environment_config.service_config
  database_config                                = local.environment_config.database_config
  incident_management_service_integration_config = local.environment_config.incident_management_service_integration
}

terraform {
  required_version = ">= 1.2.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.56.0, < 5.0.0"
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
  count              = module.app_config.has_database ? 1 : 0
  cluster_identifier = local.database_config.cluster_name
}

data "aws_iam_policy" "app_db_access_policy" {
  count = module.app_config.has_database ? 1 : 0
  name  = local.database_config.app_access_policy_name
}

data "aws_iam_policy" "migrator_db_access_policy" {
  count = module.app_config.has_database ? 1 : 0
  name  = local.database_config.migrator_access_policy_name
}

# Retrieve url for external incident management tool (e.g. Pagerduty, Splunk-On-Call)

data "aws_ssm_parameter" "incident_management_service_integration_url" {
  count = module.app_config.has_incident_management_service ? 1 : 0
  name  = local.incident_management_service_integration_config.integration_url_param_name
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

module "service" {
  source                = "../../modules/service"
  service_name          = local.service_name
  image_repository_name = module.app_config.image_repository_name
  image_tag             = local.image_tag
  vpc_id                = data.aws_vpc.network.id
  public_subnet_ids     = data.aws_subnets.public.ids
  private_subnet_ids    = data.aws_subnets.private.ids

  cpu                    = local.service_config.cpu
  memory                 = local.service_config.memory
  desired_instance_count = local.service_config.desired_instance_count

  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]

  db_vars = module.app_config.has_database ? {
    security_group_ids         = data.aws_rds_cluster.db_cluster[0].vpc_security_group_ids
    app_access_policy_arn      = data.aws_iam_policy.app_db_access_policy[0].arn
    migrator_access_policy_arn = data.aws_iam_policy.migrator_db_access_policy[0].arn
    connection_info = {
      host        = data.aws_rds_cluster.db_cluster[0].endpoint
      port        = data.aws_rds_cluster.db_cluster[0].port
      user        = local.database_config.app_username
      db_name     = data.aws_rds_cluster.db_cluster[0].database_name
      schema_name = local.database_config.schema_name
    }
  } : null

  extra_environment_variables = [
    { name : "FEATURE_FLAGS_PROJECT", value : module.feature_flags.evidently_project_name },
    { name : "BUCKET_NAME", value : local.bucket_name }
  ]
  extra_policies = {
    feature_flags_access = module.feature_flags.access_policy_arn,
    storage_access       = module.storage.access_policy_arn
  }
}

module "monitoring" {
  source = "../../modules/monitoring"
  #Email subscription list:
  #email_alerts_subscription_list = ["email1@email.com", "email2@email.com"]

  # Module takes service and ALB names to link all alerts with corresponding targets
  service_name                                = local.service_name
  load_balancer_arn_suffix                    = module.service.load_balancer_arn_suffix
  incident_management_service_integration_url = module.app_config.has_incident_management_service ? data.aws_ssm_parameter.incident_management_service_integration_url[0].value : null
}

module "feature_flags" {
  source        = "../../modules/feature-flags"
  service_name  = local.service_name
  feature_flags = module.app_config.feature_flags
}

module "storage" {
  source = "../../modules/storage"
  name   = local.bucket_name
}
