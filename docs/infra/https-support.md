# HTTPS support

Production systems will want to use HTTPS rather than HTTP to prevent man-in-the-middle attacks. This document describes how HTTPS is configured. This process will:

1. Issue an SSL/TLS certificate using Amazon Certificate Manager (ACM) for each domain that we want to support HTTPS
2. Associate the certificate with the application's load balancer so that the load balancer can serve HTTPS requests intended for that domain

## Requirements

In order to set up HTTPS support you'll also need to have [set up custom domains](/docs/infra/custom-domains.md). This is because SSL/TLS certificates must be properly configured for the specific domain to support establishing secure connections.

## 1. Set desired certificates in domain configuration

For each custom domain you want to set up in the network, define a certificate configuration object and set the `source` to `issued`. You'll probably want at least one custom domain for each application/service in the network. The custom domain must be either the same as the hosted zone or a subdomain of the hosted zone.

## 2. Update the network layer to issue the certificates

Run the following command to issue SSL/TLS certificates for each custom domain you configured

```bash
make infra-update-network NETWORK_NAME=<NETWORK_NAME>
```

Run the following command to check the status of a certificate (replace `<CERTIFICATE_ARN>` using the output from the previous command):

```bash
aws acm describe-certificate --certificate-arn <CERTIFICATE_ARN> --query Certificate.Status
```

## 4. Update `enable_https = true` in `app-config`

Update `enable_https = true` in your application's `app-config` module. You should have already set `domain_name` as part of [setting up custom domain names](/docs/infra/custom-domains.md).

## 5. Attach certificate to load balancer

Run the following command to attach the SSL/TLS certificate to the load balancer

```bash
make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```
