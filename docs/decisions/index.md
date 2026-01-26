# Architectural Decision Log

This log lists the architectural decisions for [project name].

<!-- adrlog -- Regenerate the content by using "adr-log -i -e template.md". You can install it via "npm install -g adr-log" -->

* [ADR-2022-10-01](infra/2022-10-01-use-markdown-architectural-decision-records.md) - Use Markdown Architectural Decision Records
* [ADR-2022-10-04](infra/2022-10-04-ci-cd-interface.md) - CI/CD Interface
* [ADR-2022-10-05](infra/2022-10-05-use-custom-implementation-of-github-oidc.md) - Use custom implementation of GitHub OIDC to authenticate GitHub actions with AWS rather than using module in Terraform Registry
* [ADR-2022-10-07](infra/2022-10-07-manage-ecr-in-prod-account-module.md) - Manage ECR in prod account module
* [ADR-2023-05-09](infra/2023-05-09-separate-terraform-backend-configs-into-separate-config-files.md) - Separate tfbackend configs into separate files
* [ADR-2023-05-25](infra/2023-05-25-provision-database-users-with-serverless-function.md) - Provision database users with serverless function
* [ADR-2023-05-25](infra/2023-05-25-separate-database-infrastructure-into-separate-layer.md) - Separate the database infrastructure into a separate layer
* [ADR-2023-06-05](infra/2023-06-05-database-migration-architecture.md) - Database Migration Infrastructure and Deployment
* [ADR-2023-09-07](infra/2023-09-07-consolidate-infra-config-from-tfvars-files-into-config-module.md) - Consolidate infra configuration from .tfvars files into config module
* [ADR-2023-09-11](infra/2023-09-11-separate-app-infrastructure-into-layers.md) - Separate app infrastructure into layers
* [ADR-2023-11-28](infra/2023-11-28-feature-flags-system-design.md) - Feature flags system design
* [ADR-2023-12-01](infra/2023-12-01-network-layer-design.md) - Design of network layer
* [ADR-2025-01-09](infra/2025-01-09-notifications-architecture.md) - Notifications Architecture

<!-- adrlogstop -->

For new ADRs, please use [template.md](template.md) as basis.
More information on MADR is available at <https://adr.github.io/madr/>.
General information about architectural decision records is available at <https://adr.github.io/>.
