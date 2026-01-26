module "staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "grantee1"
  environment    = "grantee1"
  network_name   = "grantee1"

  database_instance_count = 2
  database_min_capacity   = 2
  database_max_capacity   = 2

  service_override_extra_environment_variables = {
    # In staging, post results to the #z_bot-analytics-ci-test channel in slack
    ACTION = "post-results"
  }
  domain_name                     = "data.grantee1.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  service_cpu    = 256
  service_memory = 2048

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
