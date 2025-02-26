module "prod_config" {
  source                  = "./env-config"
  project_name            = local.project_name
  app_name                = local.app_name
  default_region          = module.project_config.default_region
  account_name            = "prod"
  environment             = "prod"
  network_name            = "prod"
  database_instance_count = 2
  service_override_extra_environment_variables = {
    # In prod, post results to the #z_bot-sprint-reporting channel in slack
    ACTION = "post-results"
  }
  domain_name                     = null
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider

  service_cpu                    = 1024
  service_memory                 = 8192
  service_desired_instance_count = 3

  # Enables ECS Exec access for debugging or jump access.
  # Defaults to `false`. Uncomment the next line to enable.
  # ⚠️ Warning! It is not recommended to enable this in a production environment.
  # enable_command_execution = true
}
