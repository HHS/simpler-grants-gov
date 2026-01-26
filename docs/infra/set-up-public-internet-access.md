# Public internet access

Some applications depend on external services that are not provided directly by AWS. External services include:

1. Software as a service (SaaS) providers like New Relic
2. Custom API applications in the same git repository

Applications that depend on external services need access to the public internet via a NAT (Network Address Translation) gateway. This document describes how to configure public internet access for your application. The setup process will:

1. Create a [NAT gateway](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html) for each availability zone in your virtual network

Note: To access services that are provided directly by AWS, you can access them over the public internet by enabling public internet access, or you can alternatively use [VPC endpoints](https://docs.aws.amazon.com/whitepapers/latest/aws-privatelink/what-are-vpc-endpoints.html) to keep network traffic entirely within the VPC.

## 1. Configure `has_external_non_aws_service` property in app-config module

In the `infra/<APP_NAME>/app-config` module, set `has_external_non_aws_service` to `true`.

## 2. Create or update the network

If you are creating new network(s), follow the instructions in [set up network](/docs/infra/set-up-network.md)

If you are updating existing networks, run the following command for each network used by your application's environments (look at `network_name` for each environment in your application's `app-config` module).

```bash
make infra-update-network NETWORK_NAME=<NETWORK_NAME>
```

## 3. Check that your application can access the internet

Check that your application can access the internet. If your application already has an endpoint or background job that calls the internet, you can exercise that code path without needing to re-deploy the application. If not, you can test internet access by introducing a simple endpoint that accesses some public URL (e.g. google.com).

Repeat this step for each application environment.
