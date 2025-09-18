# API Key Management

- **Status:** Active
- **Last Modified:** 2025-09-04
- **Related Issue:** [#4579](https://github.com/HHS/simpler-grants-gov/issues/4579), [#3984](https://github.com/HHS/simpler-grants-gov/issues/3984)
- **Deciders:** Matt, Lucas, Julius
- **Tags:** api, key

## Context and Problem Statement

We need to support:

- A self-service method for users signing up for API keys
- A way to ensure bad API traffic doesn't saturate our API servers
- The ability to apply different API quotas for external, our own FE, and Federal partners

## Decision Drivers

1. Offloads validation/enforcement load off our bill/infrastructure
1. Easiest and fastest 0 to 1
1. Well supported
1. Open Source

## Options Considered

- [AWS API Gateway](https://aws.amazon.com/api-gateway/)
- Off the shelf API Gateway
- Custom solution

## Decision Outcome

Chosen option: "AWS API Gateway", because it gets us up and running the fastest, provides the most protection against traffic spikes/DDOS, and is the most fully formed/best practice solution.

### Positive Consequences

- Managed hosting/infra
- Scalable
- Already used successfully by other peer projects

### Negative Consequences

- Need to stay aware of the 10k key limit and ensure we aren't closing in on it without a mitigation plan in place.

## Pros and Cons of the Options

### AWS API Gateway

API Gateway by AWS is a managed, platform service that allows for key and quota enforcement.

- **Pros**
  - Scalability/cost for traffic spikes/attacks is owned by AWS
  - Key and quota enforcement is owned by AWS
  - We can integrate to retrieve keys and match them to users within our system.
  - Well supported, best practice, utilizing a vendor integrated/supported service.
  - Established solution that we don't have to build/maintain ourselves
- **Cons**
  - There is an immutable limit of 10k keys that AWS does not seem to be planning to raise
    - We are working to mitigate this with aggressive expiration of the tokens so we can keep our token count down

### Off the shelf API Gateway

Use an existing API Gateway that requires we manage/run the offering on our infrastructure. Some examples include [Kraken](https://www.krakend.io/) and [Kong](https://konghq.com/products/kong-gateway), but we did not specifically evaluate any products in this category.

- **Pros**
  - Open Source
  - Established solution that we don't have to build/maintain ourselves
- **Cons**
  - We take on the management/infrastructure costs of running the software

### Custom solution

Implement quota and key enforcement directly in the API code.

- **Pros**
  - Does exactly what we need, nothing more nothing less
- **Cons**
  - We take on the management/infrastructure costs of running the software
  - We have to build and maintain the solution.

## Links

- [AWS Gateway Documentation](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
- ...
