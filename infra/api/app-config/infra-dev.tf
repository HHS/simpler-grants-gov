# api service for the infra-dev environment (AWS account 061664787759, network_name "infra-dev-simpler-grants").
#
# infra-dev mirrors the existing dev environment's service set (api with database,
# OpenSearch, and the workflow service). A few environment-specific settings are
# deferred for the initial infrastructure bring-up because they don't exist yet
# in the new account:
#   - Notifications: no SES domain identity yet.
#   - New Relic entity GUIDs: create the infra-dev entities, then fill these in.

module "infra_dev_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-dev"
  network_name   = "infra-dev-simpler-grants"

  domain_name            = "api.dev.simpler.grants.gov"
  secondary_domain_names = ["alb.dev.simpler.grants.gov"]
  enable_https           = true

  enable_api_gateway_domain_name = true

  s3_cdn_domain_name = "files.dev.simpler.grants.gov"
  enable_cdn_alias   = true

  mtls_domain_name = "soap.dev.simpler.grants.gov"

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_deletion_protection  = false # non-prod experimental environment
  database_newrelic_entity_guid = ""    # Populate once the New Relic entity for the infra-dev RDS cluster exists

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = false # Enable once an SES domain identity exists for infra-dev

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-dev primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the infra-dev mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the infra-dev ECS service host exists

  # Sizing mirrors dev.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_scaling_max_capacity   = 4

  database_min_capacity   = 2
  database_max_capacity   = 4
  database_instance_count = 2

  has_search            = true
  search_engine_version = "OpenSearch_2.15"
  # infra-dev's AWS account has its own IAM Identity Center reserved-SSO suffix,
  # different from the shared account default in env-config.
  search_sso_admin_role_name = "AWSReservedSSO_AdministratorAccess_73856a8074e1d297"

  service_override_extra_environment_variables = {
    ENABLE_WORKFLOW_ENDPOINTS             = 1
    ENABLE_AWARD_RECOMMENDATION_ENDPOINTS = 1
    ENABLE_GRANTOR_OPPORTUNITY_ENDPOINTS  = 1
    ENABLE_FILE_UPLOAD_ENDPOINTS          = 1

    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-dev-simpler-grants-gov"

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING               = "true"
    ENABLE_ORG_SAVED_OPPORTUNITY_NOTIFICATIONS = "true"

    # PDF Generation
    FRONTEND_URL             = "https://dev.simpler.grants.gov"
    DOCRAPTOR_TEST_MODE      = "true"
    PDF_GENERATION_USE_MOCKS = "false"

    # Workflow
    WORKFLOW_SERVICE_INTERNAL_USER_ID = "5711f79c-2445-47c7-bbcb-c8caa293ffad"

    # Job lock — enabled in dev/staging while we validate it
    ENABLE_JOB_LOCK = "true"
  }

  enable_workflow_service = true

  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true
}
