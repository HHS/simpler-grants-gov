module "grantor1_config" {
  source                            = "./env-config"
  project_name                      = local.project_name
  app_name                          = local.app_name
  default_region                    = module.project_config.default_region
  environment                       = "grantor1"
  network_name                      = "grantor1"
  domain_name                       = "api.grantor1.teams.simpler.grants.gov"
  secondary_domain_names            = ["alb.grantor1.teams.simpler.grants.gov"]
  s3_cdn_domain_name                = "files.grantor1.teams.simpler.grants.gov"
  mtls_domain_name                  = "soap.grantor1.teams.simpler.grants.gov"
  enable_https                      = true
  has_database                      = local.has_database
  database_enable_http_endpoint     = true
  database_engine_version           = "17.9" # Matches the live cluster (auto minor upgrade)
  database_newrelic_entity_guid     = ""     # Populate once the New Relic entity for the grantor1 RDS cluster exists
  database_deletion_protection      = false
  has_incident_management_service   = local.has_incident_management_service
  enable_identity_provider          = local.enable_identity_provider
  enable_notifications              = local.enable_notifications
  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the grantor1 primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the grantor1 mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the grantor1 ECS service host exists

  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-auto-scaling.html
  # https://us-east-1.console.aws.amazon.com/ecs/v2/clusters/api-staging/services/api-staging/health?region=us-east-1
  # instance_desired_instance_count and instance_scaling_min_capacity are scaled for the average CPU and Memory
  # seen over 12 months, as of November 2024 exlucing an outlier range around February 2024.
  # With a minimum of 2, as a general best pratice.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  # instance_scaling_max_capacity is 2x the instance_scaling_min_capacity
  # this is so that we can see some scaling behavior in dev without burning $$$ for no reason.
  instance_scaling_max_capacity = 4

  # Single writer, no reader: low-traffic team env.
  database_min_capacity   = 0.5
  database_max_capacity   = 4
  database_instance_count = 1

  has_search = true
  # https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html#choosing-version
  search_engine_version = "OpenSearch_2.15"

  service_override_extra_environment_variables = {

    ENABLE_FILE_UPLOAD_ENDPOINTS = 1

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING = "true"

    # PDF Generation - Staging overrides
    DOCRAPTOR_TEST_MODE      = "true"
    PDF_GENERATION_USE_MOCKS = "false"

    # Reuse staging's login.gov sandbox app registration
    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-staging-simpler-grants-gov"
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true

  enable_submission_consumer = true
}
