data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [module.project_config.network_configs[var.environment_name].vpc_name]
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

  is_temporary = terraform.workspace != "default"

  # Include project name in bucket name since buckets need to be globally unique across AWS
  bucket_name = "${local.prefix}${module.project_config.project_name}-${module.app_config.app_name}-${var.environment_name}"

  build_repository_config                        = module.app_config.build_repository_config
  environment_config                             = module.app_config.environment_configs[var.environment_name]
  service_config                                 = local.environment_config.service_config
  storage_config                                 = local.environment_config.storage_config
  incident_management_service_integration_config = local.environment_config.incident_management_service_integration
  identity_provider_config                       = local.environment_config.identity_provider_config
  notifications_config                           = local.environment_config.notifications_config

  network_config = module.project_config.network_configs[local.environment_config.network_name]
}

terraform {
  required_version = "1.13.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.81.0, < 6.0.0"
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

data "aws_acm_certificate" "cert" {
  count       = local.service_config.enable_https ? 1 : 0
  domain      = local.service_config.domain_name
  most_recent = true
}

data "aws_acm_certificate" "secondary_certs" {
  # Get secondary domain names if they exists
  for_each    = toset(lookup(local.service_config, "secondary_domain_names", []))
  domain      = each.value
  most_recent = true
}

data "aws_acm_certificate" "s3_cdn_cert" {
  count       = local.service_config.s3_cdn_domain_name != null ? 1 : 0
  domain      = local.service_config.s3_cdn_domain_name
  most_recent = true
}

data "aws_acm_certificate" "mtls_cert" {
  count       = local.service_config.mtls_domain_name != null ? 1 : 0
  domain      = local.service_config.mtls_domain_name
  most_recent = true
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
  source           = "../../modules/service"
  service_name     = local.service_config.service_name
  environment_name = var.environment_name

  image_repository_arn = local.build_repository_config.repository_arn
  image_repository_url = local.build_repository_config.repository_url

  image_tag = local.image_tag

  vpc_id             = data.aws_vpc.network.id
  public_subnet_ids  = data.aws_subnets.public.ids
  private_subnet_ids = data.aws_subnets.private.ids

  certificate_arn        = local.service_config.enable_https == true ? data.aws_acm_certificate.cert[0].arn : null
  domain_name            = local.service_config.domain_name
  s3_cdn_domain_name     = local.service_config.s3_cdn_domain_name
  s3_cdn_certificate_arn = local.service_config.s3_cdn_domain_name != null ? data.aws_acm_certificate.s3_cdn_cert[0].arn : null

  hosted_zone_id = null

  # This is used by the API when hosting a side-by-side ALB for mTLS traffic to the API
  enable_mtls_load_balancer = true
  mtls_domain_name          = local.service_config.mtls_domain_name
  mtls_certificate_arn      = local.service_config.mtls_domain_name != null ? data.aws_acm_certificate.mtls_cert[0].arn : null


  fargate_cpu              = local.service_config.cpu
  fargate_memory           = local.service_config.memory
  desired_instance_count   = local.service_config.desired_instance_count
  enable_command_execution = local.service_config.enable_command_execution
  max_capacity             = local.service_config.instance_scaling_max_capacity
  min_capacity             = local.service_config.instance_scaling_min_capacity
  enable_autoscaling       = true

  aws_services_security_group_id = data.aws_security_groups.aws_services.ids[0]

  file_upload_jobs     = local.service_config.file_upload_jobs
  enable_s3_cdn        = true
  s3_cdn_bucket_name   = "public-files"
  scheduled_jobs       = local.environment_config.scheduled_jobs
  s3_buckets           = local.environment_config.s3_buckets
  enable_drafts_bucket = true

  # API Gateway variables
  enable_api_gateway         = true
  optional_extra_alb_domains = toset(lookup(local.service_config, "secondary_domain_names", []))
  optional_extra_alb_certs   = local.service_config.enable_https == true ? [for cert in data.aws_acm_certificate.secondary_certs : cert.arn] : []

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

  pinpoint_app_id       = local.pinpoint_app_id
  hosted_zone           = local.network_config.domain_config.hosted_zone
  ses_configuration_set = local.ses_configuration_set

  extra_environment_variables = merge(
    {
      BUCKET_NAME = local.storage_config.bucket_name
    },
    # local.identity_provider_environment_variables,
    local.notifications_environment_variables,
    local.service_config.extra_environment_variables
  )

  secrets = concat(
    [for secret_name in keys(local.service_config.secrets) : {
      name      = secret_name
      valueFrom = module.secrets[secret_name].secret_arn
    }],
    module.app_config.enable_identity_provider ? [{
      # name      = "COGNITO_CLIENT_SECRET"
      # valueFrom = module.identity_provider_client[0].client_secret_arn
    }] : [],
    local.environment_config.search_config != null ? [{
      name      = "SEARCH_USERNAME"
      valueFrom = data.aws_ssm_parameter.search_username_arn[0].arn
    }] : [],
    local.environment_config.search_config != null ? [{
      name      = "SEARCH_PASSWORD"
      valueFrom = data.aws_ssm_parameter.search_password_arn[0].arn
    }] : [],
    local.environment_config.search_config != null ? [{
      name      = "SEARCH_ENDPOINT"
      valueFrom = data.aws_ssm_parameter.search_endpoint_arn[0].arn
    }] : []
  )

  extra_policies = merge(
    {
      # storage_access = module.storage.access_policy_arn
    },
    module.app_config.enable_identity_provider ? {
      # identity_provider_access = module.identity_provider_client[0].access_policy_arn,
    } : {}
  )

  is_temporary = local.is_temporary
}
