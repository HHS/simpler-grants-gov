# Infrastructure configuration

## Configure infrastructure with configuration modules

The infrastructure derives all of its configuration from the following modules:

- Project config ([/infra/project-config/](/infra/project-config/))
- App config (`/infra/<APP_NAME>/app-config` per application)

Shell scripts running in CI jobs or locally on developer machines treat config modules as root modules and fetch configuration values by running `terraform apply -auto-approve` followed by `terraform output`.

Root modules across the infrastructure layers fetch configuration values by calling the config modules as child modules:

```terraform
module "project_config" {
  source = "../../project-config"
}

module "app_config" {
  source = "../app-config"
}
```

### Design config module outputs to be static

Config modules are designed to be static. This means that all of the outputs can be statically determined without needing to execute the code. In particular:

- All config module outputs are either constant or derived from constants via deterministic functions.
- Config module outputs do not rely on the environment, including which root module is being applied, which workspace is selected, or the current timestamp.
- Config modules have no side effects. In particular, they do not create any infrastructure resources.

When configuring your project and application, keep these principles in mind to avoid violating the static nature of config modules.

## Benefits of config modules over variable definitions (.tfvars) files

Putting configuration in static configuration modules has a number of benefits over managing configuration in Terraform [variable definitions (.tfvars) files](https://developer.hashicorp.com/terraform/language/values/variables#assigning-values-to-root-module-variables):

1. Environment-specific configuration can be forced to adopt a common convention by generating the configuration value through code. For example, each application's service name is defined as `"${var.app_name}-${var.environment}"`.
2. Configuration values can be used outside of Terraform by shell scripts and CI/CD workflows by calling `terraform output` after calling `terraform apply -auto-approve`. If configuration values were embedded in `.tfvars` files, the scripts would need to parse the `.tfvars` files for those values. Note that `-auto-approve` is safe for config modules since they are entirely static and have no side effects.
3. Eliminate the possibility of passing in the incorrect `.tfvars` file to `terraform plan/apply`. Since we [reuse the same root module with multiple terraform backend configs](/docs/decisions/infra/2023-05-09-separate-terraform-backend-configs-into-separate-config-files.md), having separate `.tfvars` requires that after `terraform init` is called with a specific `-backend-config` file, the corresponding `.tfvars` file needs to be passed to `terraform plan`/`terraform apply`. This creates opportunity for error if the incorrect variable definitions file is used when a particular backend has been initialized.
