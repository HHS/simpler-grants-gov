# Staging and production environments

Set up staging and production environments to create a path to production for releases.

## Account setup

*This section is split up into two parts. Feel free to delete the one that doesn't apply to your project.*

- All non-production environments (development, staging, etc.) share a single AWS account
- Production environment uses its own dedicated AWS account
- When setting up production, [repeat the account setup steps for the production account](/docs/infra/set-up-aws-account.md)

---

- Every environment has its own AWS account
- When setting up staging and production, [repeat the account setup steps for each environment](/docs/infra/set-up-aws-account.md)

## Virtual network (VPC) setup

*This section is split up into two parts. Feel free to delete the one that doesn't apply to your project.*

- All environments within the same AWS account share a single VPC
- When setting up staging, you can skip the VPC setup step since staging will reuse the VPC created for the development environment
- When setting up production, [repeat the VPC setup steps for the production account](/docs/infra/set-up-network.md)

---

- Each environment gets its own VPC
- When setting up staging and production, [repeat the VPC setup steps for each environment](/docs/infra/set-up-network.md)

## Application environment

- When setting up staging and production, you can skip the build repository setup step since staging and production will reuse the build repository created for the development environment.
- [Repeat the application database](/docs/infra/set-up-database.md) and [applcation environment setup steps](/docs/infra/set-up-app-env.md) for each environment. Remember to update `staging.tf` and `prod.tf` to:
  - Confirm the `network_name` is set to the virtual network you want to use for the environment.
  - Tune the environment configuration values (service_cpu, service_memory. and service_desired_instance_count) based on expected load.
  - Set the `domain_name` to the desired custom domain name for the environment (This assumes you have already [set up custom domains](/docs/infra/custom-domains.md)).
