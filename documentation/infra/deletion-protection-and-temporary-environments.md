# Deletion protection and temporary environments

Resources like databases, load balancers, and S3 buckets have deletion protection enabled to prevent accidental data loss in permanent environments. However, temporary environments — such as [pull request environments](./pull-request-environments.md) and CI test environments — need to be destroyed automatically when they're no longer needed. This document explains the convention used to conditionally disable deletion protection in temporary environments so that cleanup workflows can destroy resources without manual intervention.

## How temporary environments are identified

Temporary environments are identified using [Terraform workspaces](./develop-and-test-infrastructure-in-isolation-using-workspaces.md). Each Terraform root module defines a local variable `is_temporary` based on whether the current workspace is the `default` workspace:

```hcl
# infra/<app_name>/service/main.tf

locals {
  # All non-default terraform workspaces are considered temporary.
  # Temporary environments do not have deletion protection enabled.
  # Examples: pull request preview environments are temporary.
  is_temporary = terraform.workspace != "default"
}
```

This local is then passed to child modules as a variable:

```hcl
module "service" {
  ...
  is_temporary = local.is_temporary
}
```

The `default` workspace is used for permanent environments (e.g. dev, staging, prod). Any other workspace — whether created by a PR environment workflow, a CI pipeline, or a developer testing in isolation — is considered temporary.

## The `is_temporary` pattern for gating deletion protection

Each module that manages a deletion-protected resource accepts an `is_temporary` variable and uses it to conditionally disable deletion protection. The variable defaults to `false` so that resources are protected unless explicitly marked as temporary.

Each module defines the variable the same way:

```hcl
variable "is_temporary" {
  description = "Whether the service is meant to be spun up temporarily (e.g. for automated infra tests). This is used to disable deletion protection."
  type        = bool
  default     = false
}
```

The expression used depends on the resource's deletion protection attribute. For boolean attributes, negate `is_temporary`:

```hcl
# Boolean deletion protection (e.g. ALB, RDS)
enable_deletion_protection = !var.is_temporary

# S3 force destroy
force_destroy = var.is_temporary
```

Some resources use non-boolean values. For example, Cognito user pools use string values:

```hcl
deletion_protection = var.is_temporary ? "INACTIVE" : "ACTIVE"
```

Always keep the attribute on its own line with the standard comment so that the pattern is easy to find with grep:

```hcl
# Use a separate line to support automated terraform destroy commands
force_destroy = var.is_temporary
```

Search for `is_temporary` across the codebase to see all resources currently using this pattern.

## What happens if you don't gate deletion protection

If a deletion-protected resource does not use the `is_temporary` pattern:

- **Cleanup workflows fail.** The PR environment destroy workflow and CI cleanup jobs run `terraform destroy` in non-default workspaces. If a resource has deletion protection unconditionally enabled, the destroy will fail.
- **Orphaned resources accumulate.** Failed destroys leave resources running in AWS, accruing costs.
- **Manual intervention is required.** Someone has to manually disable deletion protection and delete the orphaned resources.
- **CI pipelines break.** Subsequent CI runs may fail due to naming conflicts with orphaned resources.

## Cleanup mechanisms that depend on this pattern

Automated cleanup workflows rely on `is_temporary` being properly gated:

- **PR environment destroy workflows** — When a pull request is merged or closed, [pr-environment-destroy.yml](/.github/workflows/pr-environment-destroy.yml) runs `terraform destroy` in the PR's workspace and then deletes the workspace. See [Pull request environments](./pull-request-environments.md) for details.
- **Developer workspace cleanup** — Developers working in [isolated workspaces](./develop-and-test-infrastructure-in-isolation-using-workspaces.md) run `terraform destroy` to clean up after merging their changes.
- **CI infrastructure checks** — The [ci-infra.yml](/.github/workflows/ci-infra.yml) workflow creates temporary workspaces for infrastructure validation and destroys them after checks complete.

## See also

- [Pull request environments](./pull-request-environments.md)
- [Develop and test infrastructure in isolation using workspaces](./develop-and-test-infrastructure-in-isolation-using-workspaces.md)
- [Destroy infrastructure](./destroy-infrastructure.md)
