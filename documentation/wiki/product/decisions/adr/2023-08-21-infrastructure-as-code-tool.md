# Infrastructure as Code Tool

- **Status:** Accepted
- **Last Modified:** 2023-07-14 <!-- REQUIRED -->
- **Related Issue:** [#93](https://github.com/HHS/grants-api/issues/93) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly <!-- REQUIRED -->
- **Tags:** Hosting, Infrastructure <!-- OPTIONAL -->

## Context and Problem Statement

Infrastructure as Code (IaC) is the process of using code to manage hosting infrastructure. IaC is desirable because it produces more efficient, reproducable, readable, and interoperable deployment workflows.

IaC tools often have overlapping feature-sets and strategies, however they can be broadly characterized by provisioning versus configuration, mutable versus immutable, and procedural versus declarative. A tool or set of tools should should be selected for the project in order to best facilitate change management.

## Decision Drivers <!-- RECOMMENDED -->

- **Interoperability:** The tools should support multiple hosting providers.
- **Declarative:** The tools should support a declarative syntax.
- **Immutability:** The tools should support an immutable approach to infrastructure management.
- **Support and Documentation:** The tools should have excellent documentation and example use-cases.
- **Adoption:** The tools should have broad adoption to make it easier for the public to utilize the project code, get assistance from outside resources if necessary, and potentially grow the team.

## Options Considered

- Terraform with Docker
- CloudFormation with Docker
- Cloud Development Kit with Docker
- Chef with Ansible

## Decision Outcome <!-- REQUIRED -->

The project will use Terraform with Docker for provisioning infrastructure and creating and configuring images.

### Positive Consequences <!-- OPTIONAL -->

- The provisioning and configuration of infrastracture supporting the project will be captured in code using widely adopted, open source, and well-documented tools.
- Deployments can be tested in lower environments using the same configuration as higher environments.
- IaC supports continuous and automated deployment for lower environments and production.
- History of changes to infratstructure is stored in version control which provides better auditability, an easy-to-read record of changes, and an easier path to reversion of changes.
- Infrastructure updates are faster and more reliable.

### Negative Consequences

- Infrastrcture takes longer to deploy initially.

## Pros and Cons of the Options <!-- OPTIONAL -->

### Terraform with Docker

- **Pros**
  -  Terraform is interoperable, widely adopted (with [37K stars](https://github.com/hashicorp/terraform/stargazers) as example metric), has excellent documentation, and supports declarative and immutable strategies.
  - Docker images offer a widely adopted and developer-friendly mechanism that captures most aspects of configuration management.
  - Terraform with Docker best aligns with the each of the decision drivers.
  - The engineering team has Terraform templates and modules that can be used on the project, experience using Terraform, and institutional support for the tool.
- **Cons**
  - Terraform has changed its license from the [Mozilla Public License (v2.0) to the Business Source License (v1.1)](https://github.com/hashicorp/terraform/commit/b145fbcaadf0fa7d0e7040eac641d9aef2a26433) which could affect the community support for and adoption of the tool.

### CloudFormation with Docker

- **Pros**
  - CloudFormation is created and supported by AWS.
  - Tool is well-documented with many templates for projects and user interface tools.
  - Tool is free with AWS account.
- **Cons**
  - Tool is closed-source, procedural, and not interoperable.
  - Tool is not modular which makes it harder to share recipes or configurations for similar tools or features.
  - Testing is not well supported.
  - Poor perceived developer experience.

### Cloud Development Kit with Docker

- **Pros**
  - Cloud Development Kit is created and supported by AWS.
  - Tool supports many of the decision drivers.
  - Allows developers to use programming languages used in the API and front-end to manage cloud infrastructure.
- **Cons**
  - Tool is not open source.
  - Tool is not interoperable.
  - Tool is relatively new and not widely adopted.
  - Engineers on the team and supporting instutions have low level of experience with the tool.


### Chef with Ansible

- **Pros**
  - Chef and Ansible are open source, interoperable, widely adopted, and well-documented.
- **Cons**
  - Tools are procedural, which can lead to unexpected outcomes and fragile deployments.
  - Docker captures most aspects of configuration management in a developer-friendly and immutable format.
