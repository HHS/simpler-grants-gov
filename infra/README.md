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

Details about terraform root modules and child modules are documented in [module-architecture](../documentation/infra/module-architecture.md).

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

The environments share the same root modules but will have different configurations. Backend configuration is saved as [`.tfbackend`](https://developer.hashicorp.com/terraform/language/backend#file) files. Most `.tfbackend` files are named after the environment. For example, the `[app_name]/service` infrastructure resources for the `dev` environment are configured via `dev.s3.tfbackend`. Resources for a module that are shared across environments, such as the build-repository, use `shared.s3.tfbackend`. Resources that are shared across the entire account (e.g. /infra/accounts) use `<account name>.<account id>.s3.tfbackend`.

### 🔀 Project workflow

This project relies on Make targets in the [root Makefile](../Makefile), which in turn call shell scripts in [./bin](../bin). The shell scripts call terraform commands. Many of the shell scripts are also called by the [Github Actions CI/CD](../.github/workflows).

Generally you should use the Make targets or the underlying bin scripts, but you can call the underlying terraform commands if needed. See [making-infra-changes](../documentation/infra/making-infra-changes.md) for more details.

### 🛡️ Account safety guards

Each environment maps to an AWS account: the network config in [`project-config/networks.tf`](./project-config/networks.tf) has an `account_name`, and that name resolves to an account id via the matching `infra/accounts/<account_name>.<account_id>.s3.tfbackend` file. When environments live in different accounts, it's easy to run an apply with the wrong AWS profile/SSO role active and target the wrong account.

To prevent that, the environment-scoped root modules (`networks`, `[app_name]/service`, `[app_name]/database`) refuse to run against the wrong account, using two complementary guards:

1. **Provider `allowed_account_ids`** — each `provider "aws"` block is restricted to the account the environment/network is configured for. If the active credentials are for a different account, the AWS provider errors out before making any changes. This covers `plan`, `apply`, **and `destroy`**.
2. **`aws-account-guard` module** ([`modules/aws-account-guard`](./modules/aws-account-guard)) — a `data.aws_caller_identity` postcondition that fails during `plan` with a clear, actionable message naming the target account.

Both resolve the expected account id from the same source of truth — the provider-less [`account-id-by-name`](./modules/account-id-by-name) module, which reads the `infra/accounts/<account_name>.<account_id>.s3.tfbackend` filename. Keeping that resolver provider-less is what lets the `allowed_account_ids` provider argument reference it without creating a dependency cycle.

If you hit an error like `Wrong AWS account: the active credentials belong to account <X>, but <...> must be deployed to account <Y>`, switch to the correct AWS profile / SSO role for that environment's account (e.g. `export AWS_PROFILE=...`) and retry.

> **Note:** the `build-repository` layer is intentionally **not** guarded this way — it can be deployed to more than one account from the same code, so it has no single expected account. Its backstop is that each account has its own state bucket (`simpler-grants-gov-<account_id>-<region>-tf`), so a wrong-account run fails on the S3 backend.

## 💻 Development

### 1️⃣ First time initialization

To set up this project for the first time (aka it has never been deployed to the target AWS account):

1. [Configure the project](../infra/project-config/main.tf) (These values will be used in subsequent infra setup steps to namespace resources and add infrastructure tags.)
2. [Set up infrastructure developer tools](../documentation/infra/set-up-infrastructure-tools.md)
3. [Set up AWS account](../documentation/infra/set-up-aws-account.md)
4. [Set up the virtual network (VPC)](../documentation/infra/set-up-network.md)
5. For each application:
    1. [Set up application build repository](../documentation/infra/set-up-app-build-repository.md)
    2. [Set up application database](../documentation/infra/set-up-database.md)
    3. [Set up application environment](../documentation/infra/set-up-app-env.md)

### 🆕 New developer

To get set up as a new developer to a project that has already been deployed to the target AWS account:

1. [Set up infrastructure developer tools](../documentation/infra/set-up-infrastructure-tools.md)
2. [Review how to make changes to infrastructure](../documentation/infra/making-infra-changes.md)
3. (Optional) Set up a [terraform workspace](../documentation/infra/intro-to-terraform-workspaces.md)

## 📇 Additional reading

Additional documentation can be found in the [documentation directory](../documentation/infra).
