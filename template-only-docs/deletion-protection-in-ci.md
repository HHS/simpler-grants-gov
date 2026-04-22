# Deletion protection in template-only CI

Template-only CI (`.github/workflows/template-only-ci-infra.yml`) provisions real AWS resources, runs Terratest against them, and tears them down — all within a single workflow run. This document explains how deletion protection works in that context and what to do when adding new deletion-protected resources.

Deletion protection matters in two different situations:

- **Temporary/PR environments** — use non-default Terraform workspaces, so `is_temporary` is automatically `true` and deletion protection is disabled. This is documented separately.
- **Template-only CI** (this document) — runs in the default workspace, so `is_temporary` is `false` and the destroy scripts must explicitly override deletion protection before tearing down resources.

## How template-only CI creates and destroys resources

Each CI run follows this lifecycle:

1. **Install** — `nava-platform infra install` creates a fresh project directory with a randomized project name (`plt-tst-act-XXXXX`)
2. **Set up** — Terratest creates infrastructure layers in order: account → network → build-repository → service
3. **Test** — Terratest validates the deployed resources (e.g. hitting the service endpoint)
4. **Destroy** — Go `defer` functions tear down each layer in reverse order using the `template-only-bin/destroy-*` scripts

All of this runs in the **default Terraform workspace**. This is different from PR environments (documented separately), which use temporary workspaces.

## The `is_temporary` pattern for temporary environments

Many resources in template-infra use an `is_temporary` variable to gate deletion protection:

```hcl
# infra/modules/service/load_balancer.tf
enable_deletion_protection = !var.is_temporary

# infra/modules/database/resources/main.tf
deletion_protection = !var.is_temporary

# infra/modules/service/access_logs.tf
force_destroy = var.is_temporary

# infra/modules/identity-provider/resources/main.tf
deletion_protection = var.is_temporary ? "INACTIVE" : "ACTIVE"
```

In project repos, `is_temporary` is typically derived from the workspace:

```hcl
is_temporary = terraform.workspace != "default"
```

This means temporary/PR workspaces get deletion protection disabled automatically. But template-only CI runs in the **default workspace**, so `is_temporary` evaluates to `false` — deletion protection stays **enabled**. The destroy scripts must explicitly override this.

## How the template destroy scripts handle deletion protection

The `template-only-bin/destroy-*` scripts use `sed` to replace `is_temporary`-based expressions with hardcoded values that disable protection, then run a targeted `terraform apply` to apply those overrides before running `terraform destroy`. The general pattern in each script is:

1. `sed` rewrites the Terraform source to hardcode deletion protection off (e.g. `force_destroy = true`, `enable_deletion_protection = false`)
2. `terraform apply -target=...` applies only the changed resources so the protection settings take effect in AWS
3. `terraform destroy` tears down all resources in the layer

The scripts that handle deletion protection overrides are:

- [`template-only-bin/destroy-app-service`](../template-only-bin/destroy-app-service) — overrides ALB deletion protection, S3 `force_destroy` for access logs and storage buckets, and Cognito user pool deletion protection
- [`template-only-bin/destroy-app-database`](../template-only-bin/destroy-app-database) — overrides RDS cluster deletion protection and backup vault `force_destroy`
- [`template-only-bin/destroy-account`](../template-only-bin/destroy-account) — uses a different pattern: adds `force_destroy = true` to Terraform backend S3 buckets and flips `prevent_destroy = true` to `false` in lifecycle rules

The remaining scripts ([`template-only-bin/destroy-network`](../template-only-bin/destroy-network) and [`template-only-bin/destroy-app-build-repository`](../template-only-bin/destroy-app-build-repository)) have no deletion-protected resources and run `terraform destroy` directly.

## Adding a new deletion-protected resource

When you add a resource that has deletion protection or `force_destroy` behavior:

1. **Use the `is_temporary` pattern in Terraform.** Gate the protection attribute on `var.is_temporary`, following the conventions above. Add a comment like `# Use a separate line to support automated terraform destroy commands` so the intent is clear.

2. **Update the relevant `template-only-bin/destroy-*` script.** Add a `sed` command that replaces your `is_temporary` expression with a hardcoded value that disables protection. Add a matching `-target` to the `terraform apply` command so the override is applied before `terraform destroy` runs.

3. **Test temporary environment cleanup first.** Verify that your resource is properly cleaned up when destroying a temporary/PR environment (non-default workspace where `is_temporary = true`). This is a much faster dev/test cycle than template-only CI.

4. **Test template-only CI.** Once temporary environment cleanup works, run the template-only CI workflow to verify that the destroy step completes successfully with your sed overrides. A failed destroy leaves orphaned resources in AWS that need manual cleanup (see below).

## Detecting and cleaning up orphaned resources

If a CI run fails or is cancelled before the destroy step completes, resources are left behind in AWS. Template-only CI resources are tagged with the `plt-tst-act-*` project name pattern, and there are two workflows that handle them:

- **Scan** — [`.github/workflows/template-only-scan-orphaned-infra-test-resources.yml`](../.github/workflows/template-only-scan-orphaned-infra-test-resources.yml) runs daily and calls [`template-only-bin/cleanup-test-resources --dry-run`](../template-only-bin/cleanup-test-resources) to detect orphaned resources. It uses the AWS Resource Groups Tagging API to find all resources tagged with `plt-tst-act-*` project names. If orphaned resources are found, the workflow fails to trigger a notification.

- **Cleanup** — [`.github/workflows/template-only-cleanup-orphaned-infra-test-resources.yml`](../.github/workflows/template-only-cleanup-orphaned-infra-test-resources.yml) is a manually-triggered workflow that runs [`template-only-bin/cleanup-test-resources`](../template-only-bin/cleanup-test-resources) to delete orphaned resources. It supports targeting a specific project (e.g. `plt-tst-act-12345`) or finding all matching projects. Cleanup is intentionally manual (not automatic) to avoid masking underlying test issues that should be fixed.

The cleanup script works via AWS APIs and resource tags, not Terraform state — it finds resources by tag, then deletes them in dependency order (ECS services before clusters, S3 contents before buckets, etc.). This means it can clean up resources even when Terraform state has been lost.
