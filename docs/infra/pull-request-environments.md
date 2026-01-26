# Pull request environments

A temporary environment is created for each pull request that stays up while the pull request is open. The endpoint for the pull request and the deployed commit are added to the pull request description, and updated when the environment is updated. Use cases for the temporary pull request environment includes:

- Allow other delivery stakeholders—including product managers, designers, and business owners—to review changes before being merged and deployed
- Enable automated end-to-end tests on the pull request
- Enable automated accessibility checks on the pull request
- Facilitate workspace creation for developing and testing service layer infrastructure changes

## Lifecycle of pull request environments

A pull request environment is created when a pull request is opened or reopened, and destroyed when the pull request is merged or closed. When new commits are pushed up to the pull request, the pull request environment is updated.

## Shared database of pull request environments

Pull request environments share the same database as the dev environment. This has the following benefits:

- Enables testers to leverage existing test user accounts and accumulated test data
- Reduces the need for manual data seeding or migration scripts
- Better simulates production-like conditions where the application must handle pre-existing data, potentially revealing edge cases and integration issues that might not be apparent with a fresh database
- Reduces environment provisioning time significantly since creating and destroying database clusters typically takes 20-40 minutes

## Shared identity provider for pull request environments

All pull request environments use the same Cognito user pool as the dev environment to enable the sharing of data between pull request environments and the dev environment. This is necessary because in order to access existing user data, users must authenticate with the same identity that was used to create the data.

## Isolate database migrations into separate pull requests

Database migrations are not reflected in PR environments. In particular, PR environments share the same database with the dev environment, so database migrations that exist in the pull request are not run on the database to avoid impacting the dev environment.

Therefore, isolate database changes in their own pull request and merge that pull request first before opening pull requests with application changes that depend on those database changes. This practice has the following benefits:

- Enables PR environments to continue to be fully functional and testable when there are application changes that depend on database changes
- Enables database changes to be tested and deployed in isolation, which helps ensure that existing deployed application code is backwards compatible with new database changes

This guidance is not strict. It is still okay to combine database migrations and application changes in a single pull request. However, when doing so, note that the PR environment may not be fully functional if the application changes rely on database migrations.

Note also that this guidance pertains to pull requests, not local development. It is still okay and encouraged to develop database and application changes together during local development.

## Implementing pull request environments for each application

Pull request environments are created by GitHub Actions workflows. There are two reusable callable workflows that manage pull request environments:

- [pr-environment-checks.yml](/.github/workflows/pr-environment-checks.yml) - creates or updates a temporary environment in a separate Terraform workspace for a given application and pull request
- [pr-environment-destroy.yml](/.github/workflows/pr-environment-destroy.yml) - destroys a temporary environment and workspace for a given application and pull request

Using these reusable workflows, configure PR environments for each application with application-specific workflows:

- `ci-<APP_NAME>-pr-environment-checks.yml`
  - Based on [ci-{{app_name}}-pr-environment-checks.yml](https://github.com/navapbc/template-infra/blob/main/.github/workflows/ci-{{app_name}}-pr-environment-checks.yml.jinja)
- `ci-<APP_NAME>-pr-environment-destroy.yml`
  - Based on [ci-{{app_name}}-pr-environment-destroy.yml](https://github.com/navapbc/template-infra/blob/main/.github/workflows/ci-{{app_name}}-pr-environment-destroy.yml.jinja)
