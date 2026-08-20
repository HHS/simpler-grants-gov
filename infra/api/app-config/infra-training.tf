# api service for the infra-training environment (AWS account 049145893907, network_name "infra-training").


module "infra_training_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "infra-training"
  network_name   = "infra-training"

  domain_name            = "api.training.simpler.grants.gov"
  secondary_domain_names = ["alb.training.simpler.grants.gov"]
  enable_https           = false
  # s3_cdn_domain_name = "files.training.simpler.grants.gov" # Set once a hosted zone/ACM cert exists in 049145893907
  # mtls_domain_name   = "soap.training.simpler.grants.gov"  # Set once a hosted zone/ACM cert exists in 049145893907

  has_database                  = local.has_database
  database_enable_http_endpoint = true
  database_engine_version       = "17.7"
  database_deletion_protection  = false                                                # non-prod experimental environment
  database_newrelic_entity_guid = "NTI0OTgwOXxJTkZSQXxOQXwtMjEwNzYwNjQ1MjUwNjc2ODE4OQ" # Same entity as training

  has_incident_management_service = local.has_incident_management_service
  enable_identity_provider        = local.enable_identity_provider
  enable_notifications            = true

  service_newrelic_entity_guid      = "NTI0OTgwOXxJTkZSQXxOQXwtNTMyNjczNTExNjkwODE1NjMyMA"
  service_newrelic_mtls_entity_guid = "NTI0OTgwOXxJTkZSQXxOQXwxMTEyMzE1NDM1OTM1OTM5OTYy"
  api_host_newrelic_entity_guid     = "NTI0OTgwOXxBUE18QVBQTElDQVRJT058OTgyMjgwNTEz"

  # Sizing mirrors training.
  instance_desired_instance_count = 2
  instance_scaling_min_capacity   = 2
  instance_scaling_max_capacity   = 4

  database_min_capacity   = 2
  database_max_capacity   = 4
  database_instance_count = 2

  has_search            = true
  search_engine_version = "OpenSearch_2.15"

  search_sso_admin_role_name = "AWSReservedSSO_AdministratorAccess_43bdcb088d20dc60"

  service_override_extra_environment_variables = {
    SAM_GOV_BASE_URL = "https://api.sam.gov"

    LOGIN_GOV_CLIENT_ID = "urn:gov:gsa:openidconnect.profiles:sp:sso:hhs-training-simpler-grants-gov"

    # Email notification
    RESET_EMAILS_WITHOUT_SENDING               = "false"
    ENABLE_ORG_SAVED_OPPORTUNITY_NOTIFICATIONS = "true"
    ENABLE_GRANTOR_OPPORTUNITY_ENDPOINTS       = 1

    # Workflow. This is training's internal user id, reused because infra-training's database
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
