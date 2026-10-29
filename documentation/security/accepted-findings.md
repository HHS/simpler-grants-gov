# AWS Security Hub - Accepted Findings

This document tracks Security Hub findings that have been reviewed and accepted as not applicable or not actionable for this environment.

## EC2.172: VPC Block Public Access

- **Severity:** MEDIUM
- **Status:** Accepted (Not Applicable)
- **Date Evaluated:** 2025-12-01

### Description

This control checks whether EC2 VPC Block Public Access settings are configured to block internet gateway traffic for all VPCs in the account.

### Why This Is Accepted

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

- **Severity:** HIGH
- **Status:** Accepted (False Positive)
- **Date Evaluated:** 2025-11-25

### Description

AWS Security Hub recommends that CloudFront distributions have a default root object configured to prevent exposing S3 bucket contents when users access the root URL.

### Why This Is Accepted

This control **does not apply** to our CloudFront distribution because:

1. **Not an S3 Origin**: Our CloudFront distribution uses an Application Load Balancer (ALB) custom origin

2. **Dynamic Application**: We serve a Next.js application that handles routing dynamically. Setting a `default_root_object` interferes with the application's client-side routing for subdirectories (e.g., `/search`, `/opportunities`).

3. **No Content Exposure Risk**: When users access the root URL, requests are forwarded to our ALB and handled by the Next.js application. There is no risk of exposing backend file structures or bucket contents.

The `default_root_object` setting is designed for S3-hosted static websites to prevent directory listing exposure. This is not relevant for ALB origins serving dynamic applications.

### Configuration

```terraform
# infra/modules/service/cdn.tf
resource "aws_cloudfront_distribution" "cdn" {
  # No default_root_object configured - intentional for ALB origin
  enabled = true

  dynamic "origin" {
    for_each = var.enable_alb_cdn ? [1] : []
    content {
      domain_name = local.origin_domain_name
      origin_id   = local.default_origin_id
      custom_origin_config {  # ALB custom origin, not S3
        origin_protocol_policy = "http-only"
        # ...
      }
    }
  }
}
```

### References

- [AWS Security Hub CloudFront Controls](https://docs.aws.amazon.com/securityhub/latest/userguide/cloudfront-controls.html)
- This control specifically targets S3 origins and does not apply to custom origins

---

## ECS.5: ECS Containers Non-Root User

- **Severity:** HIGH
- **Status:** Accepted (Operational Requirement)
- **Date Evaluated:** 2025-11-24

### Description

AWS Security Hub recommends that ECS containers use read-only root filesystems to limit attack surface.

### Why This Is Accepted

Fluent Bit containers require write access to the filesystem for:

- Writing log buffer files during log aggregation
- Managing temporary state for log forwarding
- Handling log rotation and buffering

This is a documented operational requirement for log aggregation sidecars.

### Affected Resources

- Fluent Bit log aggregation containers in ECS task definitions

### Mitigation

- Fluent Bit containers run with minimal privileges
- Write access is limited to specific directories needed for log processing
- Container isolation prevents impact to application containers

---

## Review Process

All Security Hub findings should be:

1. Investigated to determine if remediation is possible
2. Fixed if the security concern is valid and applicable
3. Documented here if accepted as false positive or operational requirement
4. Reviewed periodically (at least quarterly) to ensure the justification remains valid
