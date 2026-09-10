# api service for the infra-staging environment (AWS account 317380566348, network_name "infra-staging").

module "infra_staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-staging"
  network_name   = "infra-staging"

  app_environment_name = "staging"

  domain_name                  = "api.staging.simpler.grants.gov"
  secondary_domain_names       = ["alb.staging.simpler.grants.gov"]
  scanner_callback_domain_name = "alb.staging.simpler.grants.gov"
  enable_https                 = true

  # Both of these are globally unique per AWS service; staging releases them first (see staging.tf).
  enable_api_gateway_domain_name = true

  s3_cdn_domain_name = "files.staging.simpler.grants.gov"
  enable_cdn_alias   = true

  mtls_domain_name = "soap.staging.simpler.grants.gov"

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_deletion_protection  = false                                             # non-prod experimental environment
  database_newrelic_entity_guid = "NTI0OTgwOXxJTkZSQXxOQXwtMjA3MTAxMDcwODY2NTUyNTU" # Same entity as staging

  has_incident_management_service   = local.has_incident_management_service
  enable_identity_provider          = local.enable_identity_provider
  enable_notifications              = true
  service_newrelic_entity_guid      = "NTI0OTgwOXxJTkZSQXxOQXwzMDI2MDE0OTk3ODY3NDMwMjA3"
  service_newrelic_mtls_entity_guid = "NTI0OTgwOXxJTkZSQXxOQXwtMzgzNjIwODA5MTQ5MzcxNTc5OA"
  api_host_newrelic_entity_guid     = "NTI0OTgwOXxBUE18QVBQTElDQVRJT058OTc2Mzk2OTQ1"

  # Sizing mirrors staging.
  instance_memory                 = 4096
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_scaling_max_capacity   = 4

  database_min_capacity   = 2
  database_max_capacity   = 4
  database_instance_count = 2

  has_search            = true
  search_engine_version = "OpenSearch_2.15"

  search_sso_admin_role_name = "AWSReservedSSO_AdministratorAccess_e85dcedcdbe7e774"

  service_override_extra_environment_variables = {
    ENABLE_WORKFLOW_ENDPOINTS             = 1
    ENABLE_AWARD_RECOMMENDATION_ENDPOINTS = 1
    ENABLE_GRANTOR_OPPORTUNITY_ENDPOINTS  = 1
    ENABLE_FILE_UPLOAD_ENDPOINTS          = 1

    # Override the env-config default, which would derive a nonexistent hhs-infra-staging client id.
    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-staging-simpler-grants-gov"

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING               = "false"
    ENABLE_ORG_SAVED_OPPORTUNITY_NOTIFICATIONS = "true"

    # PDF Generation
    FRONTEND_URL             = "https://staging.simpler.grants.gov"
    DOCRAPTOR_TEST_MODE      = "true"
    PDF_GENERATION_USE_MOCKS = "false"

    # Workflow. This is staging's internal user id, reused because infra-staging's database
    # is restored from a staging snapshot and therefore carries the same user row. The
    # workflow service REQUIRES this row to exist: brought up against an empty database it
    # will fail at runtime, not at apply time, so a non-snapshot bring-up must either seed
    # this user or point this at one that exists. Same arrangement as infra-dev, which
    # reuses dev's id for the same reason.
    WORKFLOW_SERVICE_INTERNAL_USER_ID = "903bf2e6-b213-4744-9f95-66ccfd98a819"

    # Job lock — enabled in dev/staging while we validate it
    ENABLE_JOB_LOCK = "true"
  }

  enable_workflow_service = true

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Matches staging, which has this enabled.
  enable_command_execution = true
}
