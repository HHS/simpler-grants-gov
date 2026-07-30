# analytics service for the infra-training environment (AWS account 049145893907, network_name "infra-training").

module "infra_training_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  account_name   = "training"
  environment    = "infra-training"
  network_name   = "infra-training"

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-training analytics RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_instance_count       = 2
  database_min_capacity         = 2
  database_max_capacity         = 2

  service_override_extra_environment_variables = {
    # Mirrors training, which posts results to the #z_bot-sprint-reporting channel in slack
    ACTION = "post-results"
  }
  domain_name                     = "data.training.simpler.grants.gov"
  enable_https                    = false # No ACM cert / hosted zone in the infra-training account yet
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  service_cpu                    = 1024
  service_memory                 = 8192
  service_desired_instance_count = 3

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # ⚠️ Warning! It is not recommended to enable this in a production environment.
  # enable_command_execution = true
}
