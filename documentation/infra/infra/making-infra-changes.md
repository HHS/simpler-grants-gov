# Making and applying infrastructure changes

## Requirements

First read [Module Architecture](./module-architecture.md) to understand how the terraform modules are structured.

## Using make targets (recommended)

For most changes you can use the Make targets provided in the root level Makefile, and can all be run from the project root.

Make changes to the account:

```bash
make infra-update-current-account
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
project-root$ ./bin/terraform-init.sh app/service dev
project-root$ ./bin/terraform-apply.sh app/service dev
project-root$ ./bin/terraform-init-and-apply.sh app/service dev  # calls init and apply in the same script
```

Look in the script files for more details on usage.

## Using terraform CLI directly

Finally, if the wrapper scripts don't meet your needs, you can always run terraform directly from the root module directory. You may need to do this if you are running terraform commands other than `terraform plan` and `terraform apply`, such as `terraform import`, `terraform taint`, etc. To do this, you'll need to pass in the appropriate `tfvars` and `tfbackend` files to `terraform init` and `terraform apply`. For example, to make changes to the application's service resources in the dev environment, cd to the `infra/app/service` directory and run:

```bash
infra/app/service$ terraform init -backend-config=dev.s3.tfbackend
infra/app/service$ terraform apply -var-file=dev.tfvars
```
