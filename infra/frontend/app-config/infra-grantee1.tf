# frontend service for the infra-grantee1 environment (AWS account 315341936575, network_name "infra-grantee1").

module "infra_grantee1_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-grantee1"
  network_name                    = "infra-grantee1"
  domain_name                     = null # "infra-grantee1.simpler.grants.gov" once DNS + certs exist
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  # Sizing mirrors training.
  instance_desired_instance_count = 4
  instance_scaling_min_capacity   = 4
  instance_scaling_max_capacity   = 20
  instance_cpu                    = 1024
  instance_memory                 = 2048

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantee1 frontend ALB exists
  service_host_newrelic_entity_guid = "" # Populate once the New Relic browser entity for the infra-grantee1 frontend exists

  # Enables ECS Exec access for debugging or jump access.
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
