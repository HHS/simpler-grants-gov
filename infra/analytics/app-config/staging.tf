module "staging_config" {
<<<<<<< before updating
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "staging"
  environment    = "staging"
  network_name   = "staging"
  service_override_extra_environment_variables = {
    # In staging, post results to the #z_bot-analytics-ci-test channel in slack
    ACTION = "post-results"
  }
=======
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "staging"
  network_name                    = "staging"
>>>>>>> after updating
  domain_name                     = null
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider

  service_cpu    = 256
  service_memory = 2048

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
