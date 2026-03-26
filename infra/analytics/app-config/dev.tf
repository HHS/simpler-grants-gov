module "dev_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "dev"
  environment    = "dev"
  network_name   = "dev"

  database_instance_count = 2
  database_min_capacity   = 2
  database_max_capacity   = 2

  service_override_extra_environment_variables = {
    # In dev, only show the results in the AWS console
    ACTION = "show-results"
  }
  domain_name                     = "data.dev.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications

  service_cpu    = 256
  service_memory = 2048

  enable_identity_provider = local.enable_identity_provider

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true

  # Uncomment to override default feature flag values
  # feature_flag_overrides = {
  #   BAR = true
  # }
}
