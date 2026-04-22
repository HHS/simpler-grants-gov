# Enable SMS Notifications via AWS End User Messaging Phone Number Pool

- Status: accepted
- Deciders: @jrpbc @doshitan
- Date: 2025-01-28

Technical story: https://github.com/navapbc/template-infra/issues/976

---

## Context and Problem Statement

The Nava Strata AWS Infrastructure template currently supports Email notifications. As part of expanding multi-channel communication capabilities, the team is introducing SMS notifications into the Strata offering.

At the infrastructure layer, this feature leverages AWS End User Messaging (SMS), which introduces several operational and provisioning considerations that impact how SMS is enabled within the Nava Strata Infrastructure Template:
- Arbitrary phone numbers cannot be used. Phone number registration and approval is a manual AWS-managed external process that may take approximately 1–15 days depending on region and use case.
- AWS recommends managing approved originators through a Phone Number Pool.  Benefits for this solution:
	- Automatic failover if an originator fails - Originator phone numbers are controlled and managed by external phone carriers (not AWS)
	- Rotation of numbers without application code changes
	- Ability to temporarily include simulator numbers for development
- The current Terraform AWS Provider has limited support for SMS Voice v2 resources:
	- Event Destinations (e.g., `TEXT_DELIVERED`, `TEXT_BLOCKED`, `TEXT_FAILURE`) cannot be fully configured and linked to a Configuration Set using Terraform. Carrier-level delivery events are necessary to understand actual delivery outcomes (which differ from API-level success responses).
	- Phone Number Pools cannot be provisioned using the Terraform AWS Provider.
	- Because of these provider limitations, certain resources must be provisioned using AWS CloudFormation, invoked from Terraform via `aws_cloudformation_stack`.

## Decision Outcome

Implement SMS notification enablement using **Infrastructure-Provisioned Phone Number Pool via CloudFormation definition within Terraform (Option 4)**, including:

1. A new infrastructure module: `notifications-sms`
2. CloudFormation-managed SMS resources (via Terraform)
3. A Phone Number Pool module `notifications-phone-pool` with associated phone numbers
4. Carrier-level delivery event logging to CloudWatch
5. IAM policies scoped to the Phone Pool ARN (least privilege)
6. Conditional VPC Interface Endpoint for `sms-voice`
7. Standardized outputs for application integration

## Considered Options

### Option 1 — Basic SMS Enablement

Provision:
- VPC Interface Endpoint
- Configuration Set
- IAM permission for `sms-voice:SendTextMessage`

**Pros**
- Simplest implementation
- Fully supported via Terraform AWS Provider

**Cons**
- Application teams manage phone number resources
- Requires broad IAM Access policy permissions
- No carrier-level delivery visibility

### Option 2 — Add Carrier-Level Delivery Monitoring

Builds on Option 1 and adds:
- Event destinations for:
  - `TEXT_DELIVERED`
  - `TEXT_BLOCKED`
  - `TEXT_FAILURE`
  - Other asynchronous carrier responses

**Pros**
- Delivery visibility
- Enables reliability improvements (e.g., the possibility of adding message retry mechanism)

**Cons**
- Requires CloudFormation integration which increase implementation complexity

### Option 3 — Infrastructure-Provisioned Single Phone Number

Builds on Option 2 and provisions a single originator number.

**Pros**
- App teams do not manage phone numbers (just the external registration process)
- Application IAM Access Policy can be restricted to one number which improves security posture

**Cons**
- Any testing is blocked until originator phone number approval
- Originator phone number rotation requires Terraform changes
- Single number increases operational risk

### Option 4 — Infrastructure-Provisioned Phone Number Pool (Selected)

Builds on Option 2 and provisions:

- Phone Number Pool
- Associated phone number (When phone number registration is approved)
- Optional simulator phone number is a provisioned for development purpose

**Pros**
- Aligns with AWS best practices
- Supports number rotation without code changes
- Application IAM Access Policy scoped to pool ARN (least privilege)
- Simulator Phone Number support for development - no need to wait for originator phone number approval for basic testing.
- Reduced operational risk - Multiple phone numbers can be added to the pool

**Cons**
- Higher infrastructure complexity
- Requires CloudFormation integration

## Rationale

Option 4 provides:

- Strong security posture through least-privilege IAM
- Improved operational resilience via number pooling
- Carrier-level delivery observability
- Development/testing flexibility via simulator phone number
- Alignment with AWS best practices

It balances reliability, security, and observability while managing Terraform provider limitations.
