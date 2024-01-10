# Introduction to Terraform

## Basic Terraform Commands

The `terraform init` command is used to initialize a working directory containing Terraform configuration files. This is the first command that should be run after writing a new Terraform configuration or cloning an existing one from version control.

The `terraform plan` command creates an execution plan, which lets you preview the changes that Terraform plans to make to your infrastructure. By default, when Terraform creates a plan it:

- Reads the current state of any already-existing remote objects to make sure that the Terraform state is up-to-date.
- Compares the current configuration to the prior state and noting any differences.
- Proposes a set of change actions that should, if applied, make the remote objects match the configuration.

The `terraform apply` command executes the actions proposed in a Terraform plan deploying the infrastructure specified in the configuration. Use with caution. The configuration becomes idempotent once a subsequent apply returns 0 changes.

The `terraform destroy` command is a convenient way to destroy all remote objects managed by a particular Terraform configuration. Use `terraform plan -destroy` to preview what remote objects will be destroyed if you run `terraform destroy`.

⚠️ WARNING! ⚠️ This is a destructive command! As a best practice, it's recommended that you comment out resources in non-development environments rather than running this command. `terraform destroy` should only be used as a way to cleanup a development environment. e.g. a developers workspace after they are done with it.

For more information about terraform commands follow the link below:

- [Basic CLI Features](https://www.terraform.io/cli/commands)

## Terraform Dependency Lock File

The [dependency lock file](https://www.terraform.io/language/files/dependency-lock) tracks provider dependencies. It belongs to the configuration as a whole and is created when running `terraform ini`. The lock file is always named `.terraform.lock.hcl`, and this name is intended to signify that it is a lock file for various items that Terraform caches in the `.terraform` subdirectory of your working directory. You should include this file in your version control repository so that you can discuss potential changes to your external dependencies via code review, just as you would discuss potential changes to your configuration itself.  

## Modules

A module is a container for multiple resources that are used together. Modules can be used to create lightweight abstractions, so that you can describe your infrastructure in terms of its architecture, rather than directly in terms of physical objects. The .tf files in your working directory when you run `terraform plan` or `terraform apply` together form the root module. In this root module you will call modules that you create from the module directory to build the infrastructure required to provide any functionality needed for the application.

## Terraform Workspaces

Workspaces are used to allow multiple engineers to deploy their own stacks for development and testing. Read more about it in [Terraform Workspaces](./intro-to-terraform-workspaces.md)
