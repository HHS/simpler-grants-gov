# nofos service for the infra-dev environment (AWS account 061664787759, network_name "infra-dev-simpler-grants").
#
# infra-dev mirrors the existing dev environment's nofos service + database.

module "infra_dev_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "infra-dev"
  network_name                    = "infra-dev-simpler-grants"
  domain_name                     = "nofos.dev.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_notifications            = local.enable_notifications
  enable_identity_provider        = local.enable_identity_provider

  database_newrelic_entity_guid = ""     # Populate once the New Relic entity for the infra-dev nofos RDS cluster exists
  database_engine_version       = "17.7" # Must be >= the source snapshot's engine version when restoring from a snapshot
  database_min_capacity         = 1
  database_max_capacity         = 1
  database_instance_count       = 1

  # Alarm and recovery receipt confirmed in run 40576048291. Enable dev-only
  # calculator notifications through the existing private route; see the runbook.
  enable_pdf_readability_monitoring               = true
  monitoring_email_alert_recipient_parameter_name = "/nofos/infra-dev/monitoring/alert-email"
  pdf_readability_alarm_actions_enabled           = true
  # Coordinated synthetic dev emergency-block test. Public uploads remain off;
  # a separate reviewed restoration change returns this rule to Count.
  pdf_readability_waf = {
    rate_limit      = 10
    rate_action     = "count"
    emergency_block = true
  }

  service_override_extra_environment_variables = {}
}
