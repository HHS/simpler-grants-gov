# Terraform Unit Testing

This repo uses [Terraform's native test framework](https://developer.hashicorp.com/terraform/language/testing) (introduced in Terraform 1.6) to unit test reusable modules in `infra/modules/`.

## What these tests are

Each module that has tests contains a `tests/` subdirectory with `.tftest.hcl` files. These tests:

- Run `terraform plan` against the module using **mocked providers** — no AWS credentials are needed and no real infrastructure is created or modified.
- Assert on the _planned_ resource configuration (e.g. that encryption is enabled, that a name matches a variable, that the right number of resources is created).
- Test input variable validation rules (e.g. rejecting names with spaces or uppercase letters).

Everything runs in plan mode with mocked providers.

## What these tests are NOT

- They do not test against real environment state. The mock values in the test files (e.g. `sg-0123456789abcdef0`, `vpc-0123456789abcdef0`) are arbitrary placeholders — they are not tied to dev, staging, or prod.
- They do not catch drift between what Terraform plans and what actually gets applied to AWS.
- They are not end-to-end tests. 

## Do the HCL test files need to stay in sync with real environments?

No. Because the tests use `mock_provider`, they never read from or compare against real AWS resources. The mock values only need to satisfy the module's input variable requirements (correct format, non-empty, etc.).

The test files _do_ need to be updated when:

- A new **required variable** is added to a module and the test's `variables {}` block does not provide a value for it.
- A **variable validation rule** changes such that an existing test value now fails validation.
- A resource attribute being asserted on is **renamed or restructured** in the module.

In all of these cases the `make infra-test-modules` job in CI will fail, which is the nudge to update the test.

## Running the tests locally

Run all module unit tests at once:

```bash
make infra-test-modules
```

Run tests for a single module:

```bash
terraform -chdir=infra/modules/<module-name> init -backend=false
terraform -chdir=infra/modules/<module-name> test
```

For example, to test the `database` module:

```bash
terraform -chdir=infra/modules/database init -backend=false
terraform -chdir=infra/modules/database test
```

No AWS credentials or backend configuration are required to run the tests.

## CI integration

Module unit tests run automatically on every pull request and push to `main` that touches `infra/**` or `bin/**`. The CI job is `unit-test-terraform-modules` in `.github/workflows/ci-infra.yml` and maps to the `make infra-test-modules` target.

## Which modules have tests

The `make infra-test-modules` target discovers all subdirectories under `infra/modules/` automatically. Modules that currently have a `tests/` directory:

[![Unit Tests](https://github.com/HHS/simpler-grants-gov/actions/workflows/ci-infra.yml/badge.svg)](https://github.com/HHS/simpler-grants-gov/actions/workflows/ci-infra.yml)

- `container-image-repository`
- `database`
- `feature_flags`
- `monitoring`
- `service`
- `sqs-queue`
- `storage`

### Modules without tests

| Module | Reason / status |
|---|---|
| `auth-github-actions` | Candidate for future tests |
| `canary` | Candidate for future tests |
| `dms-networking` | Candidate for future tests |
| `domain` | Candidate for future tests |
| `file-scan-cache` | Candidate for future tests |
| `identity-provider` | Uses `resources/` + `data/` subdirectory layout; `terraform test` must be run from a subdirectory, not the module root |
| `identity-provider-client` | Same subdirectory layout constraint as `identity-provider` |
| `network` | Candidate for future tests |
| `notifications` | Same subdirectory layout constraint as `identity-provider` |
| `notifications-email-domain` | Same subdirectory layout constraint as `identity-provider` |
| `search` | Candidate for future tests |
| `secret` | Candidate for future tests |
| `secrets` | Candidate for future tests |
| `terraform-backend-s3` | Bootstrap module; applied once manually, low churn |

Modules without a `tests/` directory are skipped silently by `terraform test`.

## Writing a new test

1. Create `infra/modules/<module-name>/tests/<module-name>.tftest.hcl`.
2. Add a `mock_provider` block for each provider the module uses (at minimum `"aws"`). You only need to add `mock_data` entries for data sources the module reads — Terraform mocks everything else automatically.
3. Add a top-level `variables {}` block with values for all required input variables. Use clearly fake values (e.g. `"sg-0123456789abcdef0"`, `"vpc-0123456789abcdef0"`).
4. Add `run` blocks with `command = plan` and `assert` conditions. Each `assert` should check one specific behavior and include a clear `error_message`.

A minimal example:

```hcl
mock_provider "aws" {}

variables {
  name = "my-test-resource"
}

run "encryption_is_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.example.enable_key_rotation == true
    error_message = "KMS key must have automatic rotation enabled"
  }
}
```

## Troubleshooting

### Test fails after a module change

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: Missing required argument` or `No value for required variable` | A new required variable was added to the module but not provided in the test's `variables {}` block | Add the new variable with a fake-but-valid value to the `variables {}` block in the test file |
| `Error: Invalid value for variable` | A validation rule changed and an existing test value no longer passes | Update the test value to satisfy the new rule |
| `Error: Unsupported attribute` on an `assert` condition | A resource attribute was renamed or removed | Update the attribute reference in the `assert` condition |
| `Error: Reference to undeclared resource` in an `assert` | A resource was renamed or removed from the module | Update the resource address in the assert |

### Mock provider issues

**`Error: Missing required argument` inside a resource block (not a variable)** — The provider mock is missing a required field that Terraform does not auto-mock. Add a `mock_resource` or `mock_data` block inside `mock_provider "aws" {}` to stub that resource or data source with explicit values.

**Data source returns null/empty values in assertions** — Mock providers return zero values for all attributes unless you supply a `mock_data` block. Add one like:

```hcl
mock_provider "aws" {
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }
}
```

**Test passes locally but fails in CI** — Check that the Terraform version in CI (`ci-infra.yml`) matches the version you ran locally. Mock provider behavior changed between 1.6 and 1.7+.

### Running a single test run block

To run only one `run` block from a test file during debugging, use the `-run` flag:

```bash
terraform -chdir=infra/modules/<module-name> test -run <run_block_name>
```

### Verbose plan output

Add `-verbose` to see the full plan diff for each `run` block:

```bash
terraform -chdir=infra/modules/<module-name> test -verbose
```
