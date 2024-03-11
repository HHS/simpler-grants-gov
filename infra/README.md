# Overview

This project practices infrastructure-as-code and uses the [Terraform framework](https://www.terraform.io). This directory contains the infrastructure code for this project, including infrastructure for all application resources. This terraform project uses the [AWS provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs). It is based on the [Nava platform infrastructure template](https://github.com/navapbc/template-infra).

## 📂 Directory structure

The structure for the infrastructure code looks like this:

```text
infra/                  Infrastructure code
  accounts/             [Root module] IaC and IAM resources
  [app_name]/           Application directory: infrastructure for the main application
  modules/              Reusable child modules
  networks/             [Root module] Account level network config (shared across all apps, environments, and terraform workspaces)
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

### 🧅 Infrastructure layers

The infrastructure template is designed to operate on different layers:

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

The environments share the same root modules but will have different configurations. Backend configuration is saved as [`.tfbackend`](https://developer.hashicorp.com/terraform/language/settings/backends/configuration#file) files. Most `.tfbackend` files are named after the environment. For example, the `[app_name]/service` infrastructure resources for the `dev` environment are configured via `dev.s3.tfbackend`. Resources for a module that are shared across environments, such as the build-repository, use `shared.s3.tfbackend`. Resources that are shared across the entire account (e.g. /infra/accounts) use `<account name>.<account id>.s3.tfbackend`.

### 🔀 Project workflow

This project relies on Make targets in the [root Makefile](/Makefile), which in turn call shell scripts in [./bin](/bin). The shell scripts call terraform commands. Many of the shell scripts are also called by the [Github Actions CI/CD](/.github/workflows).

Generally you should use the Make targets or the underlying bin scripts, but you can call the underlying terraform commands if needed. See [making-infra-changes](/docs/infra/making-infra-changes.md) for more details.

## 💻 Development

### 1️⃣ First time initialization

To set up this project for the first time (aka it has never been deployed to the target AWS account):

1. [Configure the project](/infra/project-config/main.tf) (These values will be used in subsequent infra setup steps to namespace resources and add infrastructure tags.)
2. [Set up infrastructure developer tools](/docs/infra/set-up-infrastructure-tools.md)
3. [Set up AWS account](/docs/infra/set-up-aws-account.md)
4. [Set up the virtual network (VPC)](/docs/infra/set-up-network.md)
5. For each application:
    1. [Set up application build repository](/docs/infra/set-up-app-build-repository.md)
    2. [Set up application database](/docs/infra/set-up-database.md)
    3. [Set up application environment](/docs/infra/set-up-app-env.md)

### 🆕 New developer

To get set up as a new developer to a project that has already been deployed to the target AWS account:

1. [Set up infrastructure developer tools](/docs/infra/set-up-infrastructure-tools.md)
2. [Review how to make changes to infrastructure](/docs/infra/making-infra-changes.md)
3. (Optional) Set up a [terraform workspace](/docs/infra/intro-to-terraform-workspaces.md)

## 📇 Additional reading

Additional documentation can be found in the [documentation directory](/docs/infra).
