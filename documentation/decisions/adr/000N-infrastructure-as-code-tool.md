# Infrastructure as Code Tool 

- **Status:** Draft
- **Last Modified:** 2023-07-03 <!-- REQUIRED -->
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
- Chef with Ansible 

## Decision Outcome <!-- REQUIRED -->

The project will use Terraform with Docker for provisioning infrastructure and creating and configuring images. Terraform is interoperable, widely adopted (with [37K stars](https://github.com/hashicorp/terraform/stargazers) as example metric), has excellent documentation, and supports declarative and immutable strategies. Docker images offer a widely adopted and developer-friendly mechanism that captures most aspects of configuration management. 

### Positive Consequences <!-- OPTIONAL -->

- The provisioning and configuration of infrastracture supporting the project will be captured in code using widely adopted, open source, and well-documented tools.
