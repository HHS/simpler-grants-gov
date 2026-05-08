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

- `container-image-repository`
- `database`
- `feature_flags`
- `monitoring`
- `service`
- `sqs-queue`
- `storage`

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
