# Deployment Strategy

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-20 <!-- REQUIRED -->
- **Related Issue:** [187](https://github.com/HHS/grants-equity/issues/187) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Sammy Steiner, Billy Daly <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

We need to choose a deployment strategy for the Grants.gov modernization effort that suits our core needs and will host our entire application ecosystem, both the API and frontend layers.

## Decision Drivers <!-- RECOMMENDED -->

- **Reliable:** The chosen deployment strategy should be able to offer uninterrupted application uptime with consistent results.
- **Scalable:** We should be able to scale our deployment to meet the demands of our containers while remaining lean.
- **Compatible with IaC:** The strategy should be compatible with Terraform as our chosen Infrastructure as Code solution.
- **Ease of use:** We prioritize ease of use as well as cost-efficiency. We understand that engineering time spent managing details of infrastructure is a trade off to less prescriptive strategies.
- **Growth oriented:** As our applications evolve, we need our chosen deployment strategy to grow with us or be easily swapped.

## Options Considered

- ECS with Fargate or EC2 launch type
- S3
- Lambda

## Decision Outcome <!-- REQUIRED -->

Chosen option: **ECS with Fargate launch type**, because it offers the most consistent and easy to use deployment strategy to host both the front-end and API layers of the Grants.gov modernization. Current template infrastructure integrates with ECS and the Fargate launch type.

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
  - Offers less granular flexibility, favoring less DevOps overhead
  - Possible that cost is higher than EC2 launch type ([Theoretical cost optimization by Amazon ECS launch type: Fargate vs EC2](https://aws.amazon.com/blogs/containers/theoretical-cost-optimization-by-amazon-ecs-launch-type-fargate-vs-ec2/))
  - Nontrivial to gain direct access to a particular Fargate task

#### EC2

Secure and resizable compute capacity for virtually any workload.

- **Pros**
  - Ability to granularly manage and provision resources of environment
  - Can connect to an EC2 instance easily via SSH if necessary
  - Many instance types to choose from to meet our needs
  - Reliable, scalable and on-demand
  - Compatible with many other tools in the AWS arsenal
- **Cons**
  - Requires detailed management and provisioning of environment
  - Mismanagement of environment can greatly increased costs
  - Less friendly for engineering teams that are not DevOps dedicated

**A note on ECS:** It is possible to run EC2 instances to host our Docker containers without using ECS orchestration. However, since ECS is a free service provided by AWS and we would only pay for the underlying resources, forgoing ECS and an orchestration tool isn't an appealing strategy.
### S3

Object storage built to retrieve any amount of data from anywhere.

- **Pros**
  - Suitable to host static websites, our current use-case
  - Highly scalable with unlimited storage space
  - Extremely cost-effective with pay-as-needed pricing model
  - Highly durable with storage redundancy in multiple locations
  - Easy to use interface with static website hosting options
- **Cons**
  - Only suitable to host static websites, making it a difficult choice for a rapidly growing front-end in development
  - Limited customization options

### Lambda

Run code without thinking about servers or clusters

- **Pros**
  - Auto-scaling has limitations, and pay-per-request methodology is ultra lean
  - No need for redundancy in multiple Availability Zones
  - Run code without provisioning or managing any infrastructure
  - Scalable to meet high demand
- **Cons**
  - Ineffective for long-running processes, maximum duration of 15 minutes
  - Deployment package maximum size is 250 MB
  - Max Docker image size is 10 GB
  - Deploying serverless applications might require project restructuring or additional tools and ramp up
  - Less performant than alternatives with lack of dedicated resources

## Links <!-- OPTIONAL -->

Interesting read on building a static React front-end hosted in S3 with Lambda back-end:
[Server-side rendering for React in AWS Lambda](https://aws.amazon.com/blogs/compute/building-server-side-rendering-for-react-in-aws-lambda/)
