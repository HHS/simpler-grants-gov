locals {
  # app_name is the name of the application, which by convention should match the name of
  # the folder under /infra that corresponds to the application
  app_name = regex("/infra/([^/]+)/app-config$", abspath(path.module))[0]

  environments = ["dev", "staging", "prod", "training", "grantee1"]
  project_name = module.project_config.project_name

  # Whether or not the application has a database
  # If enabled:
  # 1. The networks associated with this application's environments will have
  #    VPC endpoints needed by the database layer
  # 2. Each environment's config will have a database_config property that is used to
  #    pass db_vars into the infra/modules/service module, which provides the necessary
  #    configuration for the service to access the database
  has_database = true

  # Whether or not the application depends on external non-AWS services.
  # If enabled, the networks associated with this application's environments
  # will have NAT gateways, which allows the service in the private subnet to
  # make calls to the internet.
  has_external_non_aws_service = true

  has_incident_management_service = false

  # Whether or not the application should deploy an identity provider
  # If enabled:
  # 1. Creates a Cognito user pool
  # 2. Creates a Cognito user pool app client
  # 3. Adds environment variables for the app client to the service
  enable_identity_provider = false

  # Whether or not the application should deploy a notification service.
  #
  # To use this in a particular environment, domain_name must also be set.
  # The domain name is set in infra/<APP_NAME>/app-config/<ENVIRONMENT>.tf
  # The domain name is the same domain as, or a subdomain of, the hosted zone in that environment.
  # The hosted zone is set in infra/project-config/networks.tf
  # If either (domain name or hosted zone) is not set in an environment, notifications will not actually be enabled.
  #
  # If enabled:
  # 1. Creates an AWS Pinpoint application
  # 2. Configures email notifications using AWS SES
  enable_notifications = true

  environment_configs = {
    dev      = module.dev_config
    staging  = module.staging_config
    prod     = module.prod_config
    training = module.training_config
    grantee1 = module.grantee1_config
  }

  # Map from environment name to the account name for the AWS account that
  # contains the resources for that environment. Resources that are shared
  # across environments use the key "shared".
  account_names_by_environment = {
    shared   = "simpler-grants-gov"
    dev      = "simpler-grants-gov"
    staging  = "simpler-grants-gov"
    prod     = "simpler-grants-gov"
    training = "simpler-grants-gov"
    grantee1 = "simpler-grants-gov"
  }

  # The name of the network that contains the resources shared across all
  # application environments, such as the build repository.
  # The list of networks can be found in /infra/networks
  # by looking for the backend config files of the form:
  #   <NETWORK_NAME>.s3.tfbackend
  shared_network_name = "dev"
}

module "project_config" {
  source = "../../project-config"
}
