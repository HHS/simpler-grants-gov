# Set up network

The network setup process will configure and deploy network resources needed by other modules. In particular, it will:

1. Create a nondefault VPC
2. Create public subnets for publicly accessible resources such as the application load balancer, private subnets for the application service, and private subnets for the database.
3. Create VPC endpoints for the AWS services needed by ECS Fargate to fetch the container image and log to AWS CloudWatch. If your application has a database, it will also create VPC endpoints for the AWS services needed by the database layer and a security group to contain those VPC endpoints.

## Requirements

Before setting up the network you'll need to have:

1. [Set up the AWS account](./set-up-aws-account.md)
2. Optionally adjust the configuration for the networks you want to have on your project in the [project-config module](/infra/project-config/main.tf). By default there are three networks defined, one for each application environment. If you have multiple apps and want your applications in separate networks, you may want to give the networks differentiating names (e.g. "foo-dev", "foo-prod", "bar-dev", "bar-prod", instead of just "dev", "prod").
3. [Configure the app](/infra/app/app-config/main.tf).
   1. Update `has_database` to `true` or `false` depending on whether or not your application has a database to integrate with. This setting determines whether or not to create VPC endpoints needed by the database layer.
   2. Update `has_external_non_aws_service` to `true` or `false` depending on whether or not your application makes calls to an external non-AWS service. This setting determines whether or not to create NAT gateways, which allows the service in the private subnet to make requests to the internet.
   3. Update `network_name` for your application environments. This mapping ensures that each network is configured appropriately based on the application(s) in that network (see `local.apps_in_network` in [/infra/networks/main.tf](/infra/networks/main.tf)) Failure to set the network name properly means that the network layer may not receive the correct application configurations for `has_database` and `has_external_non_aws_service`.

## 1. Configure backend

To create the tfbackend file for the new network, run

```bash
make infra-configure-network NETWORK_NAME=<NETWORK_NAME>
```

## 2. Create network resources

Now run the following commands to create the resources. Review the terraform before confirming "yes" to apply the changes.

```bash
make infra-update-network NETWORK_NAME=<NETWORK_NAME>
```

## Updating the network

If you make changes to your application's configuration that impacts the network (such as `has_database` and `has_external_non_aws_service`), make sure to update the network before you update or deploy subsequent infrastructure layers.
