# api service for the infra-grantor1 environment (AWS account 061664787759, network_name "infra-grantor1").
#
# infra-grantor1 is the "dev" account's copy of the shared account's grantor1
# environment. Config values below mirror infra/api/app-config/grantor1.tf 1:1,
# except for the settings that cannot be carried over to a different account.
# See infra/api/app-config/infra-grantee1.tf for the full rationale.
module "infra_grantor1_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-grantor1"
  network_name   = "infra-grantor1"

  # Reuses grantor1's hostnames. domain_name cannot be null -- see the comment in
  # infra/api/app-config/infra-grantee1.tf for why the plan fails without it.
  domain_name            = "api.grantor1.teams.simpler.grants.gov"
  secondary_domain_names = ["alb.grantor1.teams.simpler.grants.gov"]
  # Off until ACM certificates are imported into the "dev" account.
  enable_https = false
  # Must stay unset: their certificate lookups are gated on the domain being non-null,
  # NOT on enable_https. Uncomment once the certs exist.
  # s3_cdn_domain_name = "files.grantor1.teams.simpler.grants.gov"
  # mtls_domain_name   = "soap.grantor1.teams.simpler.grants.gov"

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_newrelic_entity_guid = "" # Populate once the New Relic entity for the infra-grantor1 RDS cluster exists
  database_deletion_protection  = false

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = false # Enable once an SES domain identity exists for infra-grantor1

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantor1 primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the infra-grantor1 mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the infra-grantor1 ECS service host exists

  # Sizing mirrors grantor1.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_scaling_max_capacity   = 4

  database_min_capacity   = 2
  database_max_capacity   = 4
  database_instance_count = 2

  has_search            = true
  search_engine_version = "OpenSearch_2.15"
  # The "dev" AWS account has its own IAM Identity Center reserved-SSO suffix,
  # different from the shared account default in env-config.
  search_sso_admin_role_name = "AWSReservedSSO_AdministratorAccess_73856a8074e1d297"

  service_override_extra_environment_variables = {

    ENABLE_WORKFLOW_ENDPOINTS             = 1
    ENABLE_AWARD_RECOMMENDATION_ENDPOINTS = 1
    ENABLE_GRANTOR_OPPORTUNITY_ENDPOINTS  = 1
    ENABLE_FILE_UPLOAD_ENDPOINTS          = 1

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING = "true"

    # PDF Generation
    FRONTEND_URL             = "https://grantor1.teams.simpler.grants.gov" # grantor1's frontend; repoint once infra-grantor1 has DNS
    DOCRAPTOR_TEST_MODE      = "true"
    PDF_GENERATION_USE_MOCKS = "false"

    # Reuse staging's login.gov sandbox app registration
    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-staging-simpler-grants-gov"
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true

  enable_workflow_service = true
}
