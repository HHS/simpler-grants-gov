# Set up AWS account

The AWS account setup process will:

1. Create the [Terraform backend](https://www.terraform.io/language/settings/backends/configuration) resources needed to store Terraform's infrastructure state files. The project uses an [S3 backend](https://www.terraform.io/language/settings/backends/s3).
2. Create the [OpenID connect provider in AWS](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) to allow GitHub actions to access AWS account resources.

## Prerequisites

* You'll need to have [set up infrastructure tools](./set-up-infrastructure-tools.md), like Terraform, AWS CLI, and AWS authentication.
* You'll also need to make sure the [project is configured](/infra/project-config/main.tf).

## Overview of Terraform backend management

The approach to backend management allows Terraform to both create the resources needed for a remote backend as well as allow terraform to store that configuration state in that newly created backend. This also allows us to seperate infrastructure required to support terraform from infrastructure required to support the application. Because each backend, bootstrap or environment, stores their own terraform.tfstate in these buckets, ensure that any backends that are shared use a unique key. When using a non-default workspace, the state path will be `/workspace_key_prefix/workspace_name/key`, `workspace_key_prefix` default is `env:`

## Instructions

### 1. Make sure you're authenticated into the AWS account you want to configure

The account set up sets up whatever account you're authenticated into. To see which account that is, run

```bash
aws sts get-caller-identity
```

To see a more human readable account alias instead of the account, run

```bash
aws iam list-account-aliases
```

### 2. Create backend resources and tfbackend config file

Run the following command, replacing `<ACCOUNT_NAME>` with a human readable name for the AWS account that you're authenticated into. The account name will be used to prefix the created tfbackend file so that it's easier to visually identify as opposed to identifying the file using the account id. For example, you have an account per environment, the account name can be the name of the environment (e.g. "prod" or "staging"). Or if you are setting up an account for all lower environments, account name can be "lowers". If your AWS account has an account alias, you can also use that.

```bash
make infra-set-up-account ACCOUNT_NAME=<ACCOUNT_NAME>
```

This command will create the S3 tfstate bucket and the GitHub OIDC provider. It will also create a `[account name].[account id].s3.tfbackend` file in the `infra/accounts` directory.

### 3. Update the account names map in app-config

In [app-config/main.tf](/infra/app/app-config/main.tf), update the `account_names_by_environment` config to reflect the account name you chose.

## Making changes to the account

If you make changes to the account terraform and want to apply those changes, run

```bash
make infra-update-current-account
```

## Destroying infrastructure

To undeploy and destroy infrastructure, see [instructions on destroying infrastructure](./destroy-infrastructure.md).
