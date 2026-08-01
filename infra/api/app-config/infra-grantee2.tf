# api service for the infra-grantee2 environment (AWS account 061664787759, network_name "infra-grantee2").
#
# infra-grantee2 is the "dev" account's copy of the shared account's grantee2
# environment. Config values below mirror infra/api/app-config/grantee2.tf 1:1,
# except for the settings that cannot be carried over to a different account.
# See infra/api/app-config/infra-grantee1.tf for the full rationale.
module "infra_grantee2_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-grantee2"
  network_name   = "infra-grantee2"

  # Reuses grantee2's hostnames. domain_name cannot be null -- see the comment in
  # infra/api/app-config/infra-grantee1.tf for why the plan fails without it.
  domain_name            = "api.grantee2.teams.simpler.grants.gov"
  secondary_domain_names = ["alb.grantee2.teams.simpler.grants.gov"]
  # Off until ACM certificates are imported into the "dev" account.
  enable_https = false
  # Must stay unset: their certificate lookups are gated on the domain being non-null,
  # NOT on enable_https. Uncomment once the certs exist.
  # s3_cdn_domain_name = "files.grantee2.teams.simpler.grants.gov"
  # mtls_domain_name   = "soap.grantee2.teams.simpler.grants.gov"

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_newrelic_entity_guid = "" # Populate once the New Relic entity for the infra-grantee2 RDS cluster exists
  database_deletion_protection  = false

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = false # Enable once an SES domain identity exists for infra-grantee2

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantee2 primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the infra-grantee2 mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the infra-grantee2 ECS service host exists

  # Sizing mirrors grantee2.
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

    ENABLE_WORKFLOW_ENDPOINTS = 1

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING = "true"

    # PDF Generation
    FRONTEND_URL             = "https://grantee2.teams.simpler.grants.gov" # grantee2's frontend; repoint once infra-grantee2 has DNS
    DOCRAPTOR_TEST_MODE      = "true"
    PDF_GENERATION_USE_MOCKS = "false"

    # Reuse staging's login.gov sandbox app registration
    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-staging-simpler-grants-gov"

    # Virus scanning endpoints
    ENABLE_FILE_UPLOAD_ENDPOINTS = 1
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`. Uncomment the next line to enable.
  # enable_command_execution = true

  enable_workflow_service = true
}
