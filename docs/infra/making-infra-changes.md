# Making and applying infrastructure changes

## Requirements

First read [Module Architecture](/docs/infra/module-architecture.md) to understand how the terraform modules are structured.

## Using make targets (recommended)

For most changes you can use the Make targets provided in the root level Makefile, and can all be run from the project root.

Make changes to the account:

```bash
make infra-update-current-account
```

Make changes to the network:

```bash
make infra-update-network NETWORK_NAME=dev
```

Make changes to the application service in the dev environment:

```bash
make infra-update-app-service APP_NAME=app ENVIRONMENT=dev
```

Make changes to the application build repository (Note that the build repository is shared across environments, so there is no ENVIRONMENT parameter):

```bash
make infra-update-app-build-repository APP_NAME=app
```

You can also pass in extra arguments to `terraform apply` by using the `TF_CLI_ARGS` or `TF_CLI_ARGS_apply` parameter (see [Terraform's docs on TF_CLI_ARGS and TF_CLI_ARGS_name](https://developer.hashicorp.com/terraform/cli/config/environment-variables#tf_cli_args-and-tf_cli_args_name)):

```bash
# Example
TF_CLI_ARGS_apply='-input=false -auto-approve' make infra-update-app-service APP_NAME=app ENVIRONMENT=dev
TF_CLI_ARGS_apply='-var=image_tag=abcdef1' make infra-update-app-service APP_NAME=app ENVIRONMENT=dev
```

## Using terraform CLI wrapper scripts

An alternative to using the Makefile is to directly use the terraform wrapper scripts that the Makefile uses:

```bash
project-root$ ./bin/terraform-init infra/<APP_NAME>/service dev
project-root$ ./bin/terraform-apply infra/<APP_NAME>/service dev
project-root$ ./bin/terraform-init-and-apply infra/<APP_NAME>/service dev  # calls init and apply in the same script
```

Look in the script files for more details on usage.

## Using Terraform CLI directly

Finally, if the wrapper scripts don't meet your needs, you can always run `terraform` directly. You may need to do this if you are running terraform commands other than `terraform plan` and `terraform apply`, such as `terraform import`, `terraform taint`, etc. To do this, you'll need to remember to run `terraform init` with the appropriate `tfbackend` file since the root modules are shared across multiple backends. For example, to make changes to the application's service resources in the dev environment:

```bash
project-root$ cd infra/<APP_NAME>/service
infra/<APP_NAME>/service$ terraform init -backend-config=dev.s3.tfbackend
infra/<APP_NAME>/service$ terraform apply -var-file=dev.tfvars
```

or you can run the commands from the project root by using the `-chdir` flag.

```bash
project-root$ terraform init -chdir=infra/<APP_NAME>/service -backend-config=dev.s3.tfbackend
project-root$ terraform apply -chdir=infra/<APP_NAME>/service -var="environment_name=dev"
```

## See also

While developing infrastructure, you often don't want to make changes directly to the infrastructure before your infrastructure code has been tested, peer reviewed, and merged into main. In these situations, [use workspaces to develop and test your infrastructure changes in isolation](./develop-and-test-infrastructure-in-isolation-using-workspaces.md).
