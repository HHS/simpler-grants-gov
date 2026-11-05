module "prod_config" {
  source                          = "./env-config"
  project_name                    = local.project_name
  app_name                        = local.app_name
  default_region                  = module.project_config.default_region
  environment                     = "prod"
  network_name                    = "prod"
  domain_name                     = "nofos.simpler.grants.gov"
  enable_https                    = true
  has_database                    = local.has_database
  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = local.enable_notifications

  database_newrelic_entity_guid = "NTI0OTgwOXxJTkZSQXxOQXwtOTQyOTAzMTEwMjE3MDQ5NTc5"
  database_min_capacity         = 1
  database_max_capacity         = 1
  database_instance_count       = 1

  # Verify the private subscription and notification delivery before enabling
  # calculator alarm actions. The WAF rules observe public checker requests.
  enable_pdf_readability_monitoring               = true
  monitoring_email_alert_recipient_parameter_name = "/nofos/prod/monitoring/alert-email"
  pdf_readability_alarm_actions_enabled           = false
  pdf_readability_waf = {
    rate_limit      = 10
    rate_action     = "count"
    emergency_block = false
  }

  service_override_extra_environment_variables = {
    AUTHENTICATED_PDF_READABILITY_ATTEMPT_RECORDING_ENABLED = "true"
  }
}
