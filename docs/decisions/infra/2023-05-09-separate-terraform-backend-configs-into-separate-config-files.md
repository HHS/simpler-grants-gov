# Separate tfbackend configs into separate files

- Status: accepted
- Deciders: @lorenyu @shawnvanderjagt @kyeah @bneutra
- Date: 2023-05-09

## Context

Up until now, most projects adopted an infrastructure module architecture that is structured as follows: Each application environment (prod, staging, etc) is a separate root module that calls a template module. The template module defines all the application infra resources needed for an environment. Things that could be different per environment (e.g. desired ECS task count) are template variables, and each environment can have local vars (or somewhat equivalently, a tfvars file) that customizes those variables. Importantly, each environment has its own backend tfstate file, and the backend config is stored in the environment module’s `main.tf`.

An alternative approach exists to managing the backend configs. Rather than saving the backend config directly in `main.tf`, `main.tf` could contain a [partial configuration](https://developer.hashicorp.com/terraform/language/backend#partial-configuration), and the rest of the backend config would be passed in during terraform init with a command like `terraform init --backend-config=prod.s3.tfbackend`. There would no longer be a need for separate root modules for each environment. What was previously the template module would instead act as the root module, and engineers would work with different environments solely through separate tfbackend files and tfvar files. Doing this would greatly simplify the module architecture at the cost of some complexity when executing terraform commands due to the extra command line parameters. To manage the extra complexity of running terraform commands, a wrapper script (such as with Makefile commands) can be introduced.

The approach can be further extended to per-environment variable configurations via an analogous approach with [variable definitions files](https://developer.hashicorp.com/terraform/language/values/variables#variable-definitions-tfvars-files) which can be passed in with the `-var-file` command line option to terraform commands.

## Notes

For creating accounts, can't use the .tfbackend backend config file approach because the main.tf file can only have one backend configuration, so if we have the backend configuration as a partial configuration of `backend "s3" {}`, then we can't use that same module to configure a new account, since the process for configuring a new account
requires setting the backend configuration to `backend "local" {}`. We could have a separate duplicate module that has backend set to local. or we could also temporarily update the backend from `"s3"` to `"local"`, but both of those approaches seem confusing.

Another alternative is to go back to the old way of bootstrapping an account i.e. to do it via a script that creates an S3 bucket via AWS CLI. The bootstrap script would only do the minimal configuration for the S3 bucket, and let Terraform handle the remainder of the configuration, such as creating the dynamodb tables. At this point, there is no risk of not having state locking in place since the account infrastructure has not yet been checked into the repository. This might be the cleanest way to have accounts follow the same pattern of using tfbackend config files.

## Benefits of separate tfvars and tfbackend files

- **Reduce risk of differences between environments** – When different environments have their own root modules, development teams have historically sometimes added one-off resources to specific environments without adding those resources to the template module and without realizing that they're violating an important goal of having multiple environments – that environments are isolated from each other but function identically. This creates differences between environments that are more than just configuration differences. By forcing the differences to be limited to the `.tfvars` (-var) file, it limits how badly someone can get an environment out of skew.
- **DRY backend configuration** – With only a single module, there is less duplication of infrastructure code in the `main.tf` file. In particular, provider configurations, shared partial backend configuration, and certain other top-level local variables and data resources no longer need to be duplicated across environments, and provider versions can also be forced to be consistent.
- **Make receiving updates from template-infra more robust** – Previously, in order for a project to receive updates from the template-infra repo, the project would copy over template files but then revert files that the project has changed. Currently, the many `main.tf` root module files in the template are expected to be changed by the project since they define project specific backend configurations. With the separation of config files, projects are no longer expected to change the `main.tf` files, so the `main.tf` files in `infra/app/build-repository/`, `infra/project-config/`, `infra/app/app-config/`, etc. can be safely copied over from template-infra without needing to be reverted.
- **Reduce the cost of introducing additional infrastructure layers** – In the future, we may want to add new infrastructure layers that are created and updated independently of the application layer. Examples include a network layer or a database layer. We may want to keep them separate so that changes to the application infrastructure are isolated from changes to the database infrastructure, which should occur much less frequently. Previously, to add a new layer such as the database layer, we would need two additional folders: a `db-env-template` module and a `db-envs` folder with separate root modules for each environment. This mirrors the same structure that we have for the application. With separate backend config and tfvar files, we would only need a single `db` module with separate `.tfbackend` and `.tfvars` files for each environment.

## Cons of separate tfvars and tfbackend files

- **Extra layer of abstraction** – The modules themselves aren't as simple to understand since the configuration is spread out across multiple files, the `main.tf` file and the corresponding `.tfvars` and `.tfbackend` file, rather than all in one `main.tf` file.
- **Requires additional parameters when running terraform** – Due to the configuration being separated into `.tfvars` and `.tfbackend` files, terraform commands now require a `-var-file` and `-backend-config` command line options. The added complexity may require a wrapper script, introducing yet another layer of abstraction.

## Links

- Refined by [ADR-2023-09-07](./2023-09-07-consolidate-infra-config-from-tfvars-files-into-config-module.md)
