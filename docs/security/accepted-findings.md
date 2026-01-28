# AWS Security Hub Accepted Findings

This document tracks AWS Security Hub findings that have been evaluated and accepted as false positives or intentional design decisions for this project.

## Accepted Findings

### CloudFront.1: CloudFront distributions should have a default root object configured

- **Severity:** HIGH
- **Status:** Accepted (False Positive)
- **Date Evaluated:** 2025-11-25

#### Description

AWS Security Hub recommends that CloudFront distributions have a default root object configured to prevent exposing S3 bucket contents when users access the root URL.

#### Why This Is Accepted

This control **does not apply** to our CloudFront distribution because:

1. **Not an S3 Origin**: Our CloudFront distribution uses an Application Load Balancer (ALB) custom origin, not an S3 origin. The security risk this control addresses—exposing S3 bucket directory listings—is not present in our architecture.

2. **Dynamic Application**: We serve a Next.js application that handles routing dynamically. Setting a `default_root_object` interferes with the application's client-side routing for subdirectories (e.g., `/search`, `/opportunities`).

3. **No Content Exposure Risk**: When users access the root URL, requests are forwarded to our ALB and handled by the Next.js application. There is no risk of exposing backend file structures or bucket contents.

#### Configuration

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

#### References

- [AWS Security Hub CloudFront Controls](https://docs.aws.amazon.com/securityhub/latest/userguide/cloudfront-controls.html)
- This control specifically targets S3 origins and does not apply to custom origins

---

### ECS.5: ECS containers should be limited to read-only access to root filesystems

- **Severity:** HIGH
- **Status:** Accepted (Operational Requirement)
- **Date Evaluated:** 2025-11-24

#### Description

AWS Security Hub recommends that ECS containers use read-only root filesystems to limit attack surface.

#### Why This Is Accepted

Fluent Bit containers require write access to the filesystem for:

- Writing log buffer files during log aggregation
- Managing temporary state for log forwarding
- Handling log rotation and buffering

This is a documented operational requirement for log aggregation sidecars.

#### Affected Resources

- Fluent Bit log aggregation containers in ECS task definitions

#### Mitigation

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
