module "staging_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "staging"
  account_name                    = "staging"
  network_name                    = "staging"
  domain_name                     = null
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service

  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html
  # https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/frontend-dev/services/frontend-dev/health?region=us-east-1
  # instance_desired_instance_count and instance_scaling_min_capacity are scaled for the average CPU and Memory
  # seen over 12 months, as of November 2024 exlucing an outlier range around February 2024.
  # With a minimum of 2, so CPU doesn't spike to infinity on deploys.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  # instance_scaling_max_capacity is 5x the instance_scaling_min_capacity
  instance_scaling_max_capacity = 10

  service_override_extra_environment_variables = {
    NEW_RELIC_ENABLED = "false"
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
