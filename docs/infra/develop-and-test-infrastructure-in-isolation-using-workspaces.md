# Develop and test infrastructure in isolation using workspaces

When developing infrastructure code, you often want to develop and test your changes in isolation so that:

- Your changes do not impact other engineers on the team
- Other engineers working on infrastructure do not revert your changes when making their own changes
- Other engineers can review your changes before applying them

This document describes a workflow that leverages [Terraform workspaces](https://developer.hashicorp.com/terraform/language/state/workspaces) for developing and testing infrastructure changes in isolation so that they can be tested and peer reviewed before being merged into main.

## Overview

By default, each Terraform root module has a single workspace named `default`. Workspaces allow you to deploy multiple instances of the root module configuration without configuring a new backend. When you run `terraform apply` in a separate workspace, a parallel set of infrastructure resources are created.

There are a few notable differences with resources created in a non-default workspace:

1. When using terraform, you cannot deploy the same resource with the same name. The `terraform apply` will fail with an error like "A resource with the ID already exists". Therefore, to avoid naming conflicts, we prefix the resource names with the workspace name.
2. Some resources, such as database and storage buckets, enable deletion protection to prevent accidental deletion. However, non-default workspaces are intended to be temporary, so deletion protection is disabled in non-default workspaces.
3. Resources that are difficult to create in isolation, such as [DNS records](https://github.com/navapbc/template-infra/blob/2cda6da18c84aa5a3dfb038ab32be4fac363af21/infra/modules/service/dns.tf#L3), are not created at all.

## Development workflow

Follow these steps if you want to develop and test a change to the service layer. Make the appropriate changes to the `-chdir` flag if you want to make a change to a different layer, such as the database layer or network layer.

### 1. Create a new workspace

First, make sure that the Terraform root module is initialized to the dev environment

```bash
terraform -chdir=infra/<APP_NAME>/service init -reconfigure -backend-config=dev.s3.tfbackend
```

Then create a new workspace. Since the workspace name is used to prefix resource names, use a short workspace name to avoid hitting resource name character limits. Assuming you're only working on one thing at a time (following the Kanban principle of limiting work in progress), your initials would make a good workspace name. For example, if your name was Loren Yu, you could use `ly` as your workspace name.

```bash
terraform -chdir=infra/<APP_NAME>/service workspace new <WORKSPACE_NAME>
```

Verify that the new workspace was created and selected:

```bash
# List all workspaces, with a * next to the selected workspace
terraform -chdir=infra/<APP_NAME>/service workspace list
# - OR -
# Show your current selected workspace
terraform -chdir=infra/<APP_NAME>/service workspace show
```

### 2. Create resources in your workspace

```bash
terraform -chdir=infra/<APP_NAME>/service apply -var=environment_name=dev
# - OR -
make infra-update-app-service "APP_NAME=<APP_NAME>" ENVIRONMENT=dev
```

### 3. Clean up after merging to main and deploying changes to default workspace

Finally, after you merged your pull request and have deployed your changes to the default workspace, clean up your workspace so that you don't continue to accrue costs from the infrastructure resources.

```bash
# Destroy all infrastructure resources within the workspace
terraform -chdir=infra/<APP_NAME>/service destroy -var=environment_name=dev
# Select default workspace so that you can delete your workspace, since you can't delete the selected workspace
terraform -chdir=infra/<APP_NAME>/service workspace select default
# Delete your workspace
terraform -chdir=infra/<APP_NAME>/service delete <WORKSPACE_NAME>
```
