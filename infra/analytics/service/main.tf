data "aws_vpc" "network" {
  filter {
    name = "tag:Name"
    # Resolve the VPC by the environment's network_name so the environment name
    # and its VPC/network name may differ (e.g. infra-dev -> infra-dev-simpler-grants).
    values = [local.network_config.vpc_name]
  }
}

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
  # The prefix is used to create uniquely named resources per terraform workspace, which
  # are needed in CI/CD for preview environments and tests.
  #
  # To isolate changes during infrastructure development by using manually created
  # terraform workspaces, see: /docs/infra/develop-and-test-infrastructure-in-isolation-using-workspaces.md
  prefix = terraform.workspace == "default" ? "" : "${terraform.workspace}-"

  # Add environment specific tags
  tags = merge(module.project_config.default_tags, {
    owner        = "navapbc"
    app          = module.app_config.app_name
    environment  = var.environment_name
    description  = "Application resources created in ${var.environment_name} environment"
    service_name = local.service_name
  })

  service_name = "${local.prefix}${module.app_config.app_name}-${var.environment_name}"

  # All non-default terraform workspaces are considered temporary.
  # Temporary environments do not have deletion protection enabled.
  # Examples: pull request preview environments are temporary.
  is_temporary = terraform.workspace != "default"

  build_repository_config                        = module.app_config.build_repository_config
  environment_config                             = module.app_config.environment_configs[var.environment_name]
  service_config                                 = local.environment_config.service_config
  storage_config                                 = local.environment_config.storage_config
  bucket_name                                    = "${local.prefix}${local.storage_config.bucket_name}"
  incident_management_service_integration_config = local.environment_config.incident_management_service_integration
  identity_provider_config                       = local.environment_config.identity_provider_config
  notifications_config                           = local.environment_config.notifications_config

  network_config = module.project_config.network_configs[local.environment_config.network_name]
}

terraform {
  required_version = "1.14.3"

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
  region = local.service_config.region
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
  context             = "the ${var.environment_name} analytics service"
}

# Resolve the container image repository (ECR) to the AWS account that owns THIS
# environment's network, rather than the globally-shared build-repository
# account. For every existing environment the network account IS the shared
# account, so this is a no-op. It lets a self-contained environment in a separate
# AWS account (infra-dev in the "dev" account) pull from an ECR in its own
# account instead of cross-account.
data "external" "account_ids_by_name" {
  program = ["${path.module}/../../../bin/account-ids-by-name"]
}

locals {
  image_repository_account_id = data.external.account_ids_by_name.result[local.network_config.account_name]
  image_repository_url        = "${local.image_repository_account_id}.dkr.ecr.${local.build_repository_config.region}.amazonaws.com/${local.build_repository_config.name}"
  image_repository_arn        = "arn:aws:ecr:${local.build_repository_config.region}:${local.image_repository_account_id}:repository/${local.build_repository_config.name}"
}

data "aws_rds_cluster" "db_cluster" {
  count              = 1
  cluster_identifier = local.database_config.cluster_name
}

data "aws_iam_policy" "app_db_access_policy" {
  count = 1
  name  = local.database_config.app_access_policy_name
}

data "aws_iam_policy" "migrator_db_access_policy" {
  count = 1
  name  = local.database_config.migrator_access_policy_name
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

data "aws_acm_certificate" "certificate" {
  count       = local.service_config.enable_https ? 1 : 0
  domain      = local.service_config.domain_name
  key_types   = ["RSA_4096", "RSA_2048"]
  most_recent = true
}

data "aws_ssm_parameter" "incident_management_service_integration_url" {
  count = module.app_config.has_incident_management_service ? 1 : 0
  name  = local.incident_management_service_integration_config.integration_url_param_name
}

module "service" {
  source           = "../../modules/service"
  service_name     = local.service_name
  environment_name = var.environment_name

  image_repository_arn = local.image_repository_arn
  image_repository_url = local.image_repository_url

  image_tag = local.image_tag

  network_name                   = local.environment_config.network_name
  project_name                   = module.project_config.project_name
  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]

  domain_name     = null
  hosted_zone_id  = null
  certificate_arn = null
  enable_waf      = module.app_config.enable_waf

  fargate_cpu              = local.service_config.cpu
  fargate_memory           = local.service_config.memory
  desired_instance_count   = local.service_config.desired_instance_count
  enable_command_execution = local.service_config.enable_command_execution

  file_upload_jobs = local.service_config.file_upload_jobs
  scheduled_jobs   = local.environment_config.scheduled_jobs

  db_vars = module.app_config.has_database ? {
    security_group_ids         = module.database[0].security_group_ids
    app_access_policy_arn      = module.database[0].app_access_policy_arn
    migrator_access_policy_arn = module.database[0].migrator_access_policy_arn
    connection_info = {
      host        = module.database[0].host
      port        = module.database[0].port
      user        = module.database[0].app_username
      db_name     = module.database[0].db_name
      schema_name = module.database[0].schema_name
    }
  } : null

  enable_load_balancer     = false
  readonly_root_filesystem = true

  extra_environment_variables = merge(
    {
      BUCKET_NAME = local.storage_config.bucket_name
      "ENVIRONMENT" : var.environment_name
    },
    # local.identity_provider_environment_variables,
    local.notifications_environment_variables,
    local.service_config.extra_environment_variables,
    local.api_analytics_bucket_environment_variables
  )

  secrets = concat(
    [for secret_name, secret_arn in module.secrets.secret_arns : {
      name      = secret_name
      valueFrom = secret_arn
    }],
    local.feature_flags_secrets,
    module.app_config.enable_identity_provider ? [{
      # name      = "COGNITO_CLIENT_SECRET"
      # valueFrom = module.identity_provider_client[0].client_secret_arn
    }] : []
  )

  extra_policies = merge(
    {
      api_analytics_bucket_access = aws_iam_policy.api_analytics_bucket_access.arn,
      # storage_access              = module.storage.access_policy_arn
    },
    module.app_config.enable_identity_provider ? {
      identity_provider_access = module.identity_provider_client[0].access_policy_arn,
    } : {},
    module.app_config.enable_notifications ? {
      notifications_access = module.notifications[0].access_policy_arn,
    } : {},
  )

  ephemeral_write_volumes = local.service_config.ephemeral_write_volumes

  is_temporary = local.is_temporary
}
