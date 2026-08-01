# frontend service for the infra-grantor1 environment (AWS account 061664787759, network_name "infra-grantor1").
#
# Mirrors infra/frontend/app-config/grantor1.tf 1:1. HTTPS/custom domain is
# deferred until an ACM cert + Route53 hosted zone exist in the "dev" account;
# the intended domain is shown in a comment below.
module "infra_grantor1_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-grantor1"
  network_name                    = "infra-grantor1"
  domain_name                     = null # "infra-grantor1.teams.simpler.grants.gov" once DNS + certs exist
  enable_https                    = false
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  # Sizing mirrors grantor1.
  instance_desired_instance_count = 4
  instance_scaling_min_capacity   = 4
  instance_scaling_max_capacity   = 20

  instance_cpu    = 1024
  instance_memory = 2048

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantor1 frontend ALB exists
  service_host_newrelic_entity_guid = "" # Populate once the New Relic browser entity for the infra-grantor1 frontend exists

  # Enables ECS Exec access for debugging or jump access.
  # Defaults to `false`. Uncomment the next line to enable.
  # ⚠️ Warning! It is not recommended to enable this in a production environment.
  # enable_command_execution = true
}
