# api service for the infra-grantee1 environment (AWS account 315341936575, network_name "infra-grantee1").


module "infra_grantee1_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-grantee1"
  network_name   = "infra-grantee1"

  domain_name            = null # set once DNS + ACM exist in this env
  secondary_domain_names = []   # set once DNS + ACM exist in this env
  enable_https           = false
  # s3_cdn_domain_name = "files.training.simpler.grants.gov" # Set once a hosted zone/ACM cert exists in 315341936575
  # mtls_domain_name   = "soap.training.simpler.grants.gov"  # Set once a hosted zone/ACM cert exists in 315341936575

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_deletion_protection  = false # non-prod experimental environment
  database_newrelic_entity_guid = ""    # Populate once the New Relic entity for the infra-grantee1 RDS cluster exists

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = false # Enable once an SES domain identity exists for infra-grantee1

  service_newrelic_entity_guid      = "" # Populate once the New Relic entity for the infra-grantee1 primary ALB exists
  service_newrelic_mtls_entity_guid = "" # Populate once the New Relic entity for the infra-grantee1 mTLS ALB exists
  api_host_newrelic_entity_guid     = "" # Populate once the New Relic entity for the infra-grantee1 ECS service host exists

  # Sizing mirrors training.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_scaling_max_capacity   = 4

  database_min_capacity   = 2
  database_max_capacity   = 4
  database_instance_count = 2

  has_search            = true
  search_engine_version = "OpenSearch_2.15"

  # The reserved-SSO role suffix (AWSReservedSSO_<PermissionSet>_<suffix>) is generated
  # per AWS account, so the env-config default (which matches the shared account) does not
  # exist in 315341936575. null falls back to the account root principal; replace with this
  # account's own AWSReservedSSO_* role name once IAM Identity Center is wired up.
  search_sso_admin_role_name = null

  service_override_extra_environment_variables = {
    SAM_GOV_BASE_URL = "https://api.sam.gov"

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING               = "false"
    ENABLE_ORG_SAVED_OPPORTUNITY_NOTIFICATIONS = "true"
    ENABLE_GRANTOR_OPPORTUNITY_ENDPOINTS       = 1

    # Workflow. This is training's internal user id, reused because infra-grantee1's database
    # is restored from a training snapshot and therefore carries the same user row. The
    # workflow service REQUIRES this row to exist: brought up against an empty database it
    # will fail at runtime, not at apply time, so a non-snapshot bring-up must either seed
    # this user or point this at one that exists. Same arrangement as infra-dev/infra-staging,
    # which reuse dev's and staging's ids for the same reason.
    WORKFLOW_SERVICE_INTERNAL_USER_ID = "00bcaf8e-dd04-4fd1-9fb3-ea872a93178d"
    ENABLE_WORKFLOW_ENDPOINTS         = 1
  }
  # Enables ECS Exec access for debugging or jump access.
  # See https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-exec.html
  # Defaults to `false`, matching training. Uncomment the next line to enable.
  # enable_command_execution = true

  enable_workflow_service = true

  scanner_provisioned_concurrency = 1
}
