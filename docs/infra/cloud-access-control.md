# Cloud Access Control

GitHub Actions needs permissions to create, modify, and destroy resources in the AWS account as part of the CI/CD workflows. The permissions GitHub Actions has are determined by the IAM role and policy that's defined in the account layer.

## Adding/removing permissions from GitHub Actions

To add or remove permissions from the CI/CD role, update the list of AWS services that GitHub Actions has access to, defined in the project-config module in [project-config/aws_services.tf](/infra/project-config/aws_services.tf)
