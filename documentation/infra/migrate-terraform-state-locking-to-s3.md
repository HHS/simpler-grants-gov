# Upgrade Terraform state locking from DynamoDB to S3

Terraform 1.10+ supports [native S3 state locking](https://developer.hashicorp.com/terraform/language/backend/s3#state-locking) via `use_lockfile = true`, replacing the older DynamoDB-based locking. This guide walks through migrating an existing project that uses DynamoDB state locks to S3 native locking.

## Prerequisites

- Terraform >= 1.10.0
- Your project's template-infra has been updated to include the S3 locking changes (i.e., the `terraform-backend-s3` module no longer creates a DynamoDB table)

## Overview

The migration has three phases:

1. **Update backend config files** — Replace `dynamodb_table` with `use_lockfile = true` in all `.s3.tfbackend` files
2. **Reinitialize and verify** — Run `terraform init -reconfigure` and `terraform plan` for each root module
3. **Apply the accounts layer** (for every account) — Remove the DynamoDB table and related resources from AWS

## Step-by-step instructions

### 1. Update your project's template-infra

Follow the standard process for [keeping your infrastructure up to date](https://github.com/navapbc/template-infra/blob/main/README.md#keeping-your-infrastructure-up-to-date) to pull in the template changes that remove DynamoDB locking. The change is in `v0.17.0` of the template.

> **Important:** Do NOT run `terraform apply` on `infra/accounts` yet — the DynamoDB table must remain until all `.s3.tfbackend` files have been updated.

### 2. Run the migration script

The `bin/migrate-terraform-state-locking-to-s3` script automates updating all `.s3.tfbackend` files. It removes the `dynamodb_table` line and adds `use_lockfile = true`.

```bash
./bin/migrate-terraform-state-locking-to-s3
```

The script will report which files were migrated and which were already up to date.

To also reinitialize each module and run `terraform plan` automatically, use the `--reinit` flag:

```bash
./bin/migrate-terraform-state-locking-to-s3 --reinit
```

This combines steps 2, 3, and 4 below. The script will iterate over each `.s3.tfbackend` file, run `terraform init -reconfigure` and `terraform plan` for the corresponding module, and report any failures.

If you prefer to do this manually, edit each `.s3.tfbackend` file under `infra/` to:
- Remove the `dynamodb_table = "..."` line
- Add `use_lockfile   = true`

Then follow steps 3 and 4 below.

### 3. Reinitialize each root module

> **Note:** If you used `--reinit` in step 2, skip to step 5.

Run `terraform init -reconfigure` for each root module to pick up the new backend configuration. Use the existing `bin/terraform-init` script:

```bash
# For each account (replace with your account alias)
./bin/terraform-init infra/accounts <account_alias>

# For each network
./bin/terraform-init infra/networks <NETWORK_NAME>

# For each application module and environment
./bin/terraform-init infra/<APP_NAME>/build-repository shared
./bin/terraform-init infra/<APP_NAME>/database <ENVIRONMENT>
./bin/terraform-init infra/<APP_NAME>/service <ENVIRONMENT>
```

### 4. Verify with terraform plan

Run `terraform plan` for each module to confirm there are no unexpected changes. For the accounts module specifically, you should see the DynamoDB table marked for destruction:

```bash
terraform -chdir=infra/accounts plan -out=tfplan
```

Expected output for accounts:

```
Plan: 0 to add, 0 to change, 1 to destroy.
```

The one resource to destroy is `aws_dynamodb_table.terraform_lock`.

For all other modules (networks, app modules), the plan should show **no changes**.

### 5. Apply the accounts layer

Once you've verified the plans, apply the accounts layer to remove the DynamoDB table:

```bash
make infra-update-current-account
```

### 6. Update active pull requests

If your project has open pull requests with preview environments, rebase them onto the latest main branch so they pick up the migrated `.s3.tfbackend` files. Otherwise, those PR environments will still reference the old DynamoDB-based backend configuration.

### 7. Commit the updated backend files

Commit and push the updated `.s3.tfbackend` files:

```bash
git add infra/**/*.s3.tfbackend
git commit -m "Migrate terraform state locking from DynamoDB to S3"
git push
```

## Repeat for each AWS account

If your project uses multiple AWS accounts (e.g., separate accounts for lower environments and prod), repeat steps 1–7 for each account. You'll need to assume the appropriate role or configure AWS credentials for each account before running the commands.

## Rollback

If you need to roll back, you can re-add the `dynamodb_table` line to your `.s3.tfbackend` files and run `terraform init -reconfigure`. The DynamoDB table will need to be recreated by reverting the accounts module changes and applying.

## Cleanup

After confirming everything works in all environments:

- Verify no `.s3.tfbackend` files reference `dynamodb_table`
- Verify `terraform plan` shows no changes for all modules
- The DynamoDB table has been destroyed and the KMS key will be deleted after its waiting period (10 days by default)
