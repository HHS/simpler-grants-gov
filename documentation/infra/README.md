# Infrastructure Documentation

## Setup

* [Configure the project](../../infra/project-config/main.tf) (These values will be used in subsequent infra setup steps to namespace resources and add infrastructure tags.)
* [Set up infrastructure developer tools](./set-up-infrastructure-tools.md)
* [Set up AWS account](./set-up-aws-account.md)
* [Set up application build repository](./set-up-app-build-repository.md)
* [Set up application environment](./set-up-app-env.md)
* [Create the private NOFO infra-dev alert email parameter](./nofo-alert-email-setup.md)

## Technical Design

* [Module architecture](./module-architecture.md)
* [NOFO PDF pilot monitoring and alert routing](./nofo-pdf-readability-monitoring.md)

## Testing

* [Readability Calculator preparation and short verification checklist](./nofo-readability-verification-kit.md)
* [Private NOFO monitoring email routing](./nofo-private-alert-email.md)
* [Read-only Readability Calculator inspection in infra-dev](./nofo-readability-inspection.md)

* [NOFO PDF upload availability assessment and deferred test plan](./nofo-pdf-upload-assessment.md)

* [Terraform unit testing](./terraform-unit-testing.md)

## Operations

* [Prepare NOFO document history in dev](./prepare-nofo-document-history-dev.md)
* [Check NOFO production history readiness](./check-nofo-production-history.md)
* [NOFO PDF readability WAF controls and dev verification](./nofo-pdf-readability-waf.md)

## Learning

* [Introduction to Terraform](./intro-to-terraform.md)
* [Introduction to Terraform workspaces](./intro-to-terraform-workspaces.md)
