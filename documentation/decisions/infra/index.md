# Architectural Decision Log

This log lists the architectural decisions for [project name].

<!-- adrlog -- Regenerate the content by using "adr-log -i -e template.md". You can install it via "npm install -g adr-log" -->

* [ADR-0000](infra/0000-use-markdown-architectural-decision-records.md) - Use Markdown Architectural Decision Records
* [ADR-0001](infra/0001-ci-cd-interface.md) - CI/CD Interface
* [ADR-0002](infra/0002-use-custom-implementation-of-github-oidc.md) - Use custom implementation of GitHub OIDC to authenticate GitHub actions with AWS rather than using module in Terraform Registry
* [ADR-0003](infra/0003-manage-ecr-in-prod-account-module.md) - Manage ECR in prod account module
* [ADR-0004](infra/0004-separate-terraform-backend-configs-into-separate-config-files.md) - Separate tfbackend configs into separate files
* [ADR-0005](infra/0005-database-module-design.md) - Database module design
* [ADR-0006](infra/0006-provision-database-users-with-serverless-function.md) - Provision database users with serverless function
* [ADR-0007](infra/0007-database-migration-architecture.md) - Database Migration Infrastructure and Deployment

<!-- adrlogstop -->

For new ADRs, please use [template.md](template.md) as basis.
More information on MADR is available at <https://adr.github.io/madr/>.
General information about architectural decision records is available at <https://adr.github.io/>.
