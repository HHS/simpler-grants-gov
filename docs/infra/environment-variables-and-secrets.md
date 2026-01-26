# Environment variables and secrets

Applications follow [12-factor app](https://12factor.net/) principles to [store configuration as environment variables](https://12factor.net/config). The infrastructure provides some of these environment variables automatically, such as environment variables to authenticate as the ECS task role, environment variables for database access, and environment variables for accessing document storage. However, many applications require extra custom environment variables for application configuration and for access to secrets. This document describes how to configure application-specific environment variables and secrets. It also describes how to override those environment variables for a specific environment.

## Application-specific extra environment variables

Applications may need application specific configuration as environment variables. Examples may includes things like `WORKER_THREADS_COUNT`, `LOG_LEVEL`, `DB_CONNECTION_POOL_SIZE`, or `SERVER_TIMEOUT`. This section describes how to define extra environment variables for your application that are then made accessible to the ECS task by defining the environment variables in the task definition (see AWS docs on [using task definition parameters to pass environment variables to a container](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/taskdef-envfiles.html)).

> ⚠️ Note: Do not put sensitive information such as credentials as regular environment variables. The method described in this section will embed the environment variables and their values in the ECS task definition's container definitions, so anyone with access to view the task definition will be able to see the values of the environment variables. For configuring secrets, see the section below on [Secrets](#secrets)

Environment variables are defined in `infra/<APP_NAME>/app-config/env-config/environment_variables.tf`. Modify the `default_extra_environment_variables` map to define extra environment variables specific to the application. Map keys define the environment variable name, and values define the default value for the variable across application environments. For example:

```terraform
# environment_variables.tf

locals {
  default_extra_environment_variables = {
    WORKER_THREADS_COUNT = 4
    LOG_LEVEL            = "info"
  }
}
```

To override the default values for a particular environment, modify the `app-config/<environment>.tf` file for the environment, and pass overrides to the `env-config` module using the `service_override_extra_environment_variables` variable. For example:

```terraform
# dev.tf

module "dev_config" {
  source                                       = "./env-config"
  service_override_extra_environment_variables = {
    WORKER_THREADS_COUNT = 1
    LOG_LEVEL            = "debug"
  }
  ...
}
```

## Secrets

Secrets are a specific category of environment variables that need to be handled sensitively. Examples of secrets are authentication credentials such as API keys for external services. Secrets first need to be stored in AWS SSM Parameter Store as a `SecureString`. This section then describes how to make those secrets accessible to the ECS task as environment variables through the `secrets` configuration in the container definition (see AWS documentation on [retrieving Secrets Manager secrets through environment variables](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html)).

Secrets are defined in the same file that non-sensitive environment variables are defined, in `infra/<APP_NAME>/app-config/env-config/environment_variables.tf`. Modify the `secrets` map to define the secrets that the application will have access to. For each secret, the map key defines the environment variable name. The `manage_method` property, which can be set to `"generated"` or `"manual"`, defines whether or not to generate a random secret or to reference an existing secret that was manually created and stored into AWS SSM. The `secret_store_name` property defines the SSM parameter name that stores the secret value. If `manage_method = "generated"`, then `secret_store_name` is where terraform will store the secret. If `manage_method = "manual"`, then `secret_store_name` is where terraform will look for the existing secret. For example:

```terraform
# environment_variables.tf

locals {
  secrets = {
    GENERATED_SECRET = {
      manage_method     = "generated"
      secret_store_name = "/${var.app_name}-${var.environment}/generated-secret"
    }
    MANUALLY_CREATED_SECRET = {
      manage_method     = "manual"
      secret_store_name = "/${var.app_name}-${var.environment}/manually-created-secret"
    }
  }
}
```

> ⚠️ For secrets with `manage_method = "manual"`, make sure you store the secret in SSM Parameter Store *before* you try to add configure your application service with the secrets, or else the service won't be able to start since the ECS Task Executor won't be able to fetch the configured secret.
