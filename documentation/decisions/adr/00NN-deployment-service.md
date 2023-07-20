# Deployment Strategy

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-20 <!-- REQUIRED -->
- **Related Issue:** [187](https://github.com/HHS/grants-equity/issues/187) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Sammy Steiner, Billy Daly <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

We need to choose a deployment strategy for the Grants.gov modernization effort that suits our core needs and will host our entire application ecosystem, both the API and frontend layers.

## Decision Drivers <!-- RECOMMENDED -->

- **Reliable:** The chosen deployment strategy should be able to offer reliable application uptime with consistent results.
- **Scalable:** We should be able to scale our deployment to meet the demands of our containers while remaining lean.
- **Compatible with IaC:** The strategy should be compatible with Terraform as our chosen Infrastructure as Code solution
- **Ease of use:** We prioritize ease of use as well as cost-efficiency. We understand the trade-off that engineer time spent managing details of infrastructure is a trade off to less prescriptive strategies.
- **Growth oriented:** As our applications evolve, we need our chosen deployment strategy to grow with us or be easily swapped.

## Options Considered

- ECS with Fargate or EC2 launch type
- S3
- Lambda

## Decision Outcome <!-- REQUIRED -->

Chosen option: **ECS with Fargate launch type**, because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

## Pros and Cons of the Options <!-- OPTIONAL -->

### ECS with Fargate or EC2 launch type

#### Fargate

Fargate is an AWS serverless compute tool for containers.

- **Pros**
  - Run containers without having to manage or provision EC2 instances
  - Removes operational overhead of scaling, patching, securing and managing servers
  - Integrates with AWS Cloudwatch or other third party metrics tools
  - Secure, running in dedicated runtime environments
  - Scalable means pay for usage, not for reserved or wasted space
- **Cons**
  - Offers less granular flexibility, favoring of less DevOps overhead
  - Possible that cost is higher than EC2 launch type ([Theoretical cost optimization by Amazon ECS launch type: Fargate vs EC2](https://aws.amazon.com/blogs/containers/theoretical-cost-optimization-by-amazon-ecs-launch-type-fargate-vs-ec2/))

#### EC2
- **Pros**
  -
- **Cons**
  -

**A note on ECS:** It is possible to run EC2 instances to host our Docker containers without using ECS orchestration. However, since ECS is a free service provided by AWS and we would only pay for the underlying resources, forgoing ECS and an orchestration tool isn't an appealing strategy.
### S3

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...
