# Consolidate infra configuration from .tfvars files into config module

- Status: accepted
- Deciders: @lorenyu @rocketnova @kyeah @acouch
- Date: 2023-09-07

Technical Story: [Replace configure scripts with project/app config variables #312](https://github.com/navapbc/template-infra/issues/312)

## Context

Currently, application infrastructure configuration is split across config modules (see `infra/<APP_NAME>/app-config/`) as well as .tfvars files in each of the application's infra layers - infra/<APP_NAME>/build-repository, infra/<APP_NAME>/database, and infra/<APP_NAME>/service. As @kyeah pointed out, it’s easy to make mistakes when configuration is spread across multiple files, and expressed a desire to manage tfvars across environments all in a single file the way that some applications do for application configuration. Also, as @acouch [pointed out](https://github.com/navapbc/template-infra/pull/282#discussion_r1219930653), there is a lot of duplicate code with the configure scripts (setup-current-account.sh, configure-app-build-repository.sh, configure-app-database.sh, configure-app-service.sh) that configure the backend config and variable files for each infrastructure layer, which increases the burden of maintaining the configuration scripts.

## Overview

This ADR proposes the following:

- Move all environment configuration into `infra/<APP_NAME>/app-config/` modules
- Remove the need for .tfvars files
- Remove the configuration scripts that are currently used for configuring each infrastructure layer

Benefits:

- All configuration can now be managed in the `infra/<APP_NAME>/app-config/` module.
- All dependencies between root modules can be managed explicitly via the `infra/<APP_NAME>/app-config/` module.
- Custom configuration scripts no longer need to be maintained
- Eliminates the need to specify -var-file option when running terraform apply, which reduces the need for terraform wrapper scripts

## Links

- Builds on [ADR-2023-05-09](./2023-05-09-separate-terraform-backend-configs-into-separate-config-files.md)
