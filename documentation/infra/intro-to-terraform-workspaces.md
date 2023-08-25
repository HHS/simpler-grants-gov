# Workspaces

Terraform workspaces are created by default, the default workspace is named "default." Workspaces are used to allow multiple engineers to deploy their own stacks for development and testing. This allows multiple engineers to develop new features in parallel using a single environment without destroying each others infrastructure. Separate resources will be created for each engineer when using the prefix variable.

## Terraform workspace commands

`terraform workspace show [Name]`   - This command will show the workspace you working in.

`terraform workspace list [Name]`   - This command will list all workspaces.

`terraform workspace new [Name]`    - This command will create a new workspace.

`terraform workspace select [Name]` - This command will switch your workspace to the workspace you select.

`terraform workspace delete [Name]` - This command will delete the specified workspace. (does not delete infrastructure, that step will done first)

## Workspaces and prefix - A How To

 Workspaces are used to allow multiple developers to deploy their own stacks for development and testing. By default "prefix~ is set to `terraform.workspace` in the envs/dev environment, it is `staging` and `prod` in those respective environments.

### envs/dev/main.tf

``` tf
locals {
  prefix = terraform.workspace
}

module "example" {
  source  = "../../modules/example"
  prefix  = local.prefix
}

```

### modules/example/variables.tf - When creating a new module create the variable "prefix" in your variables.tf

``` tf

variable "prefix" {
  type        = string
  description = "prefix used to uniquely identify resources, allows parallel development"

}

```

### modules/example/main.tf - Use var.prefix to uniquely name resources for parallel development

``` tf

# Create the S3 bucket with a unique prefix from terraform.workspace.
resource "aws_s3_bucket" "example" {
  bucket = "${var.prefix}-bucket"

}

```

When in the workspace "shawn", the resulting bucket name created in the aws account will be `shawn-bucket`. This prevents the following undesirable situation: If resources are not actively prefixed and two developers deploy the same resource, the developer who runs their deployment second will overwrite the deployment of the first.
