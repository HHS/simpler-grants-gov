# AWS Security Hub - Accepted Findings

This document tracks Security Hub findings that have been reviewed and accepted as not applicable or not actionable for this environment.

## EC2.172: VPC Block Public Access

**Status**: Accepted - Not Applicable
**Severity**: MEDIUM
**Date**: 2025-12-01

### Description
This control checks whether EC2 VPC Block Public Access settings are configured to block internet gateway traffic for all VPCs in the account.

### Justification
This control **does not apply** to our environment because:

1. **Public Application**: The application serves public traffic through CloudFront and Application Load Balancers
2. **Internet Gateways Required**: All VPCs (dev, staging, training, prod) have internet gateways attached for legitimate public internet access
3. **Architecture Dependency**: Blocking internet gateway traffic would break core application functionality

**VPCs with Internet Gateways:**
- `vpc-08f522c5cc442d126` (dev) - `igw-09306e431523050b5`
- `vpc-0611b232a11adb719` (staging) - `igw-020caa678e123eb97`
- `vpc-00fd02917344071fc` (training) - `igw-0ad8a1811622e5284`
- `vpc-03451ea43dc6c33da` (prod) - `igw-0a37a9ae94fa58316`

### Security Posture
Public access is appropriately controlled through:
- CloudFront distributions with proper origins
- Application Load Balancers in public subnets
- Security groups restricting access to necessary ports
- Network ACLs providing additional layer of defense
- WAF rules on CloudFront (where applicable)

---

## CloudFront.1: Default Root Object

**Status**: Accepted - Not Applicable
**Severity**: MEDIUM
**Date**: Prior

### Description
This control expects CloudFront distributions to have a default root object configured.

### Justification
This control **does not apply** to our CloudFront distribution because:

1. **Not an S3 Origin**: Our CloudFront distribution uses an Application Load Balancer (ALB) custom origin
2. **Dynamic Application**: We serve a Next.js application that handles routing dynamically
3. **No Content Exposure Risk**: When users access the root URL, requests are forwarded to our ALB which serves the appropriate content

The `default_root_object` setting is designed for S3-hosted static websites to prevent directory listing exposure. This is not relevant for ALB origins serving dynamic applications.

---

## ECS.5: ECS Containers Non-Root User

**Status**: Accepted - Risk Accepted
**Severity**: MEDIUM
**Date**: Prior

### Description
This control checks whether ECS containers are running as non-root users.

### Justification
Currently accepted as containers require root access for specific operational needs. This is on the roadmap for improvement as the application security posture matures.
