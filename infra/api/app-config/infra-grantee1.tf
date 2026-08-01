# api service for the infra-grantee1 environment (AWS account 061664787759, network_name "infra-grantee1").
#
# infra-grantee1 is the "dev" account's copy of the shared account's grantee1
# environment. Config values below mirror infra/api/app-config/grantee1.tf 1:1,
# except for the settings that cannot be carried over to a different account:
#   - HTTPS: no ACM certificate or Route53 hosted zone in this account yet, so
#     enable_https is false (see the domain block below).
#   - Notifications: no SES domain identity yet.
#   - New Relic entity GUIDs: create the infra-grantee1 entities, then fill these in.
#   - search_sso_admin_role_name: the reserved-SSO role suffix is generated per
#     AWS account, so it is overridden with the "dev" account's (same value
#     infra-dev uses).
module "infra_grantee1_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-grantee1"
  network_name   = "infra-grantee1"

  # Reuses grantee1's hostnames, the same way infra-dev reuses dev's. domain_name CANNOT
  # be null here: modules/service/api_gateway.tf interpolates it into every integration
  # URI and infra/api/service/clamav.tf:33 builds api_base_url from it, neither of which
  # is gated on enable_https -- and enable_api_gateway is hardcoded true at
  # infra/api/service/main.tf:256. A null fails the plan before anything is created.
  # These names still resolve to grantee1's ALB in the shared account until
  # infra-grantee1 gets DNS of its own; nothing here serves traffic yet.
  domain_name            = "api.grantee1.teams.simpler.grants.gov"
  secondary_domain_names = ["alb.grantee1.teams.simpler.grants.gov"]
  # Off until ACM certificates are imported into the "dev" account. While false, the
  # aws_acm_certificate lookups for domain_name and secondary_domain_names are count = 0.
  enable_https = false
  # s3_cdn_domain_name and mtls_domain_name must stay unset: their certificate lookups are
  # gated on the domain being non-null, NOT on enable_https, so setting them now would
  # fail the plan. Uncomment once the certs exist.
  # s3_cdn_domain_name = "files.grantee1.teams.simpler.grants.gov"
  # mtls_domain_name   = "soap.grantee1.teams.simpler.grants.gov"

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_newrelic_entity_guid = "" # Populate once the New Relic entity for the infra-grantee1 RDS cluster exists
  database_deletion_protection  = false

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = false # Enable once an SES domain identity exists for infra-grantee1

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantee1 primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the infra-grantee1 mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the infra-grantee1 ECS service host exists

  # Sizing mirrors grantee1.
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
    FRONTEND_URL             = "https://grantee1.teams.simpler.grants.gov" # grantee1's frontend; repoint once infra-grantee1 has DNS
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
