module "dev_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "dev"
  network_name                    = "dev"
  domain_name                     = "api.dev.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  database_enable_http_endpoint   = true
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications

  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html
  # https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/api-dev/services/api-dev/health?region=us-east-1
  # instance_desired_instance_count and instance_scaling_min_capacity are scaled for the average CPU and Memory
  # seen over 12 months, as of November 2024 exlucing an outlier range around February 2024.
  # instance_desired_instance_count is 2, as a general best pratice.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  # instance_scaling_max_capacity is 2x the instance_scaling_min_capacity
  # this is so that we can observe some scaling behavior without burning $$$ for no reason.
  instance_scaling_max_capacity = 4

  # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.setting-capacity.html
  # https://us-east-1.console.aws.amazon.com/rds/home?region=us-east-1#database:id=api-dev;is-cluster=true;tab=monitoring
  # database_min_capacity is a reasonable default given a low load environment,
  # It is 2 specifically so that we can get performance insights (see the 1st link above)
  database_min_capacity = 2
  # database_max_capacity is 2x the database_min_capacity
  # this is so that we can observe some scaling behavior without burning $$$ for no reason.
  database_max_capacity = 4
  # always at least 2, for redundancy and availability
  database_instance_count = 2

  has_search = true
  # https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html#choosing-version
  search_engine_version = "OpenSearch_2.15"

  service_override_extra_environment_variables = {

    # Login.gov OAuth
    ENABLE_AUTH_ENDPOINT   = 1
    ENABLE_APPLY_ENDPOINTS = 1
    ENABLE_SOAP_API        = 1
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true

  enable_identity_provider = local.enable_identity_provider
}
