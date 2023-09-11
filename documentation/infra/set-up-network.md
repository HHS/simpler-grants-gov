# Set up network

The network setup process will:

1. Configure and deploy network resources needed by other modules. If your application has a database, it will create VPC endpoints for the AWS services needed by the database layer and a security group to contain those VPC endpoints.

## Requirements

Before setting up the database you'll need to have:

1. [Set up the AWS account](./set-up-aws-account.md)

## 1. Configure backend

To create the tfbackend file for the new application environment, run

```bash
make infra-configure-network
```

## 2. Create network resources

Now run the following commands to create the resources. Review the terraform before confirming "yes" to apply the changes.

```bash
make infra-update-network
```
