# Overview

This project practices infrastructure-as-code and uses the [Terraform framework](https://www.terraform.io). This directory contains the infrastructure code for this project, including infrastructure for all application resources. This terraform project uses the [AWS provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs). It is based on the [Nava platform infrastructure template](https://github.com/navapbc/template-infra).

## 📂 Directory structure

The structure for the infrastructure code looks like this:

```text
infra/                  Infrastructure code
  project-config/       Project-level configuration for account-level resources and resource tags
  accounts/             [Root module] IaC and IAM resources
  <APP_NAME>/           Application directory(-ies): infrastructure for the application <APP_NAME>
  modules/              Reusable child modules
  networks/             [Root module] Account level network config (shared across all apps, environments, and terraform workspaces)
  test/                 Infrastructure tests
```

Each application directory contains the following:

```text
  app-config/         Application-level configuration for the application resources (different config for different environments)
  build-repository/   [Root module] Docker image repository for the application (shared across environments and terraform workspaces)
  database/           [Root module] Configuration for database (different config for different environments)
  service/            [Root module] Configuration for containers, such as load balancer, application service (different config for different environments)
```

Details about terraform root modules and child modules are documented in [module-architecture](/docs/infra/module-architecture.md).

## 🏗️ Project architecture

### ⚙️ Configuration

The infrastructure derives all of its configuration from static configuration modules:

- Project config
- App config (per application)

The configuration modules contain only statically known information and do not have any side effects such as creating infrastructure resources. As such, they are used as both (a) root modules by shell scripts and CI/CD workflows and (b) child modules called by root modules across the infrastructure layers. See [infrastructure configuration](/docs/infra/infrastructure-configuration.md) for more info.

### 🧅 Infrastructure layers

The infrastructure is designed to operate on different layers:

- Account layer
- Network layer
- Build repository layer (per application)
- Database layer (per application)
- Service layer (per application)

### 🏜️ Application environments

This project has the following AWS environments:

- `dev`
- `staging`
- `prod`

The environments share the same root modules but will have different configurations. Backend configuration is saved as [`.tfbackend`](https://developer.hashicorp.com/terraform/language/backend#file) files. Most `.tfbackend` files are named after the environment. For example, the `<APP_NAME>/service` infrastructure resources for the `dev` environment are configured via `dev.s3.tfbackend`. Resources for a module that are shared across environments, such as the build-repository, use `shared.s3.tfbackend`. Resources that are shared across the entire account (e.g. /infra/accounts) use `<account name>.<account id>.s3.tfbackend`.

### 🔀 Project workflow

This project relies on Make targets in the [root Makefile](/Makefile), which in turn call shell scripts in [./bin](/bin). The shell scripts call `terraform` commands. Many of the shell scripts are also called by the [Github Actions CI/CD](/.github/workflows).

Generally, you should use the Make targets or the underlying bin scripts, but you can call the underlying terraform commands if needed. See [making-infra-changes](/docs/infra/making-infra-changes.md) for more details.

## 💻 Development

### 1️⃣ Getting started

To set up this project for the first time (i.e., it has never been deployed to the target AWS account):

1. Make sure you have an application that meets [the application requirements for using this infrastructure](https://github.com/navapbc/template-infra/blob/main/template-only-docs/application-requirements.md).

   **Tip:** You don't need an actual application to deploy until you want to set up the application environment (the last step).

2. Review and optionally update [your project configuration](/infra/project-config/main.tf) <!-- markdown-link-check-disable-line -->

   **Important:** Make sure you review and understand /infra/project-config/main.tf. Configuration here can have broad impact that is hard to change later, so be reasonably confident things are right initially.

   **Note:** Some application config impacts other layers besides the application environment. So if you want to minimize back and forth during set up, you should [read the requirements for setting up an application environment](/docs/infra/set-up-app-env.md#requirements) and configure #### your application infrastructure with what you currently know you need (e.g. a database, external service access).

3. [Set up infrastructure developer tools](/docs/infra/set-up-infrastructure-tools.md)

4. [Set up AWS account](/docs/infra/set-up-aws-account.md)

5. [Set up the virtual network (VPC)](/docs/infra/set-up-network.md)

6. [Set up application build repository](/docs/infra/set-up-app-build-repository.md)

7. [Set up application database](/docs/infra/set-up-database.md)

8. [Set up application environment](/docs/infra/set-up-app-env.md)

   **Tip:** If you don't yet have an application meeting [the application requirements for using this infrastructure](https://github.com/navapbc/template-infra/blob/main/template-only-docs/application-requirements.md), you can copy [this example app](https://github.com/navapbc/template-infra/tree/main/template-only-app) to your repository to have something that will run for testing the infrastructure, and swap in your actual application code later.

### Add an application to an existing repo

[Use the Platform CLI to add another application to an existing repo](https://navapbc.github.io/platform-cli/adding-an-app/)

### 🆕 New developer

To get set up as a new developer on a project that has already been deployed to the target AWS account:

1. [Set up infrastructure developer tools](/docs/infra/set-up-infrastructure-tools.md)
2. [Review how to make changes to infrastructure](/docs/infra/making-infra-changes.md)
3. [Review how to develop and test infrastructure changes](/docs/infra/develop-and-test-infrastructure-in-isolation-using-workspaces.md)
4. [Review the infrastructure style guide](/docs/infra/style-guide.md)

### Preparing for production launch

Set up the following before launching to end users in production:

- [HTTPS support](/docs/infra/https-support.md)
- [Custom domains](/docs/infra/custom-domains.md)
- [Monitoring alerts](/docs/infra/monitoring-alerts.md)
- [Web application firewall (WAF)](/docs/infra/web-application-firewall.md)
- [Staging and production environments](../docs/infra/staging-and-production-environments.md)

### Setting up additional capabilities

- [Additional applications](../docs/infra/add-application.md)
- [Background jobs](../docs/infra/background-jobs.md)
- [Custom environment variables and secrets](../docs/infra/environment-variables-and-secrets.md)
- [Identity provider](../docs/infra/identity-provider.md)
- [User notifications](../docs/infra/notifications.md)
- [Pull request (preview) environments](../docs/infra/pull-request-environments.md)
- [Service command execution](../docs/infra/service-command-execution.md)
- [Outbound public internet access](../docs/infra/set-up-public-internet-access.md)
- [CI/CD system notifications](../docs/infra/system-notifications.md)

### Day to day operations

- [Destroy infrastructure](../docs/infra/destroy-infrastructure.md)
- [Develop and test infrastructure in isolation using workspaces](../docs/infra/develop-and-test-infrastructure-in-isolation-using-workspaces.md)
- [Making infrastructure changes](../docs/infra/making-infra-changes.md)
- [Upgrade database](../docs/infra/upgrade-database.md)

### Reference

#### Architecture

- [Module architecture](../docs/infra/module-architecture.md)
- [Infrastructure configuration](../docs/infra/infrastructure-configuration.md)
- [Module dependencies](../docs/infra/module-dependencies.md)

#### Style guide

- [Infrastructure style guide](../docs/infra/style-guide.md)

#### Security

- [Cloud access control](../docs/infra/cloud-access-control.md)
- [Database access control](../docs/infra/database-access-control.md)
- [Vulnerability management](../docs/infra/vulnerability-management.md)

## 📇 Additional reading

Additional documentation can be found in the [documentation directory](/docs/infra).
