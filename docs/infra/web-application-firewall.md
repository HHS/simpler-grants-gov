# Web Application Firewall (WAF)

The infrastructure template includes support for AWS Web Application Firewall (WAF) to protect application load balancers from common web threats. This document describes how WAF is configured. The WAF setup process will:

1. Create an AWS WAF web ACL with managed rule sets in the network layer
2. Configure WAF logging to CloudWatch
3. Associate the WAF with application load balancers in the service layer

## How WAF works

WAF helps protect your web applications from common web exploits and bots that could affect availability, compromise security, or consume excessive resources. The template-infra implementation uses AWS managed rule sets that provide protection against common threats:

- **AWS Common Rule Set** - Provides general protection against common web threats like SQL injection, cross-site scripting (XSS), and other OWASP Top 10 vulnerabilities
- **AWS Known Bad Inputs Rule Set** - Blocks request patterns that are known to be invalid and are associated with exploitation or discovery of vulnerabilities

The WAF is created at the network level and can be associated with application load balancers in the service layer.

## Requirements

There are no specific prerequisites for enabling WAF.

## 1. Enable WAF in application config

WAF is disabled by default in the template. You can find and modify this setting in your application's `app-config` module (`infra/<APP_NAME>/app-config/main.tf`):

```terraform
enable_waf = true
```

## 2. Deploy the WAF in the network layer

The WAF must be created in the network layer before it can be associated with load balancers in the service layer. Note that the WAF may already have been deployed as part of the [network setup process](/docs/infra/set-up-network.md). If not, run the following command to deploy the WAF:

```bash
make infra-update-network NETWORK_NAME=<NETWORK_NAME>
```

## 3. Associate WAF with application load balancers

After the WAF is created in the network layer, run the following command to associate it with your application's load balancer:

```bash
make infra-update-app-service APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

## 4. Verify WAF protection

You can verify that the WAF is working correctly by testing it with requests that should trigger the WAF's XSS protection. The following curl commands should return a 403 Forbidden response if the WAF is properly configured:

```bash
service_endpoint="$(terraform -chdir="infra/${APP_NAME}/service" output -raw service_endpoint)"
curl -k "${service_endpoint}?search=<script>alert(1)</script>"
```

Or alternatively:

```bash
curl -k -X POST "${service_endpoint}" \
  -H "Content-Type: application/json" \
  -d '{"bad_input": "<script>alert(1)</script>"}'
```

Both commands should return a 403 Forbidden response, indicating that the WAF is blocking the malicious input.

## 5. View WAF logs

WAF logs are sent to CloudWatch. You can view these logs in the AWS CloudWatch console under the log group named `aws-waf-logs-<NETWORK_NAME>`.

## Notes on migration

If you are adding WAF to an existing application:

1. The WAF needs to be created at the network layer before applying any changes at the service layer, otherwise the service layer will not be able to find the WAF to apply.
2. Alternatively, you can temporarily set `enable_waf = false` in your application's `app-config/main.tf` during the transition.
