# Separate app infrastructure into layeres

* Status: accepted
* Deciders: @lorenyu @rocketnova @jamesbursa
* Date: 2023-09-11

Technical Story: [Document rationale for splitting up infra layers across multiple root modules](https://github.com/navapbc/template-infra/issues/431)

## Context and Problem Statement

This document builds on the database module design [ADR: Separate the database infrastructure into a separate layer](./0005-separate-database-infrastructure-into-separate-layer.md) to describe the general rationale for separating application environment infrastructure into separate root modules that are managed in separate terraform state files and updated separately rather than all in one single root module. It restates and summarizes the rationale from the previous ADR and includes additional motivating examples.

## Overview

Based on the factors in the section below, the infrastructure has been groups into the following separate layers:

* Account layer
* Network layer
* Build repository layer
* Database layer
* Service layer

### Factors

* **Variations in number and types of environments in each layer:** Not all layers of infrastructure have the same concept of "environment" as the application layer. The AWS account layer might have one account for all applications, two accounts, one for non-production environments and one for the production environment, or one account per environment. The network (VPC) layer can have similar variations (one VPC for non-prod and one for prod, or one per environment). The build repository layer only has one instance that's shared across all environments. And the database layer may or may not even be needed depending on the application. Putting all resources in one root module would disallow these variations between layers unless you introduce special case logic that behaves differently based on the environment (e.g. logic like "if environment = prod then create build-repository"), which increases complexity and reduces consistency between environments.

* **AWS uniqueness constraints on resources:** This is a special case of the previous bullet, but some resources have uniqueness constraints in AWS. For example, there can only be one OIDC provider for GitHub actions per AWS account (see [Creating OIDC identity providers](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html)). As another example, there can only be one VPC endpoint per VPC per AWS service (see [Fix conflicting DNS domain errors for interface VPC endpoints](https://repost.aws/knowledge-center/vpc-interface-endpoint-domain-conflict)). Therefore, if multiple application environments share a VPC, they can't each create a VPC endpoint for the same AWS service. As such, the VPC endpoint logically belongs to the network layer and VPC endpoints should be created and managed per network environment rather than per application environment.

* **Policy constraints on what resources project team is authorized to manage:** Some projects have restrictions on who can create or modify certain categories of resources. For example, on some projects, VPCs have to be created by a central cloud operations team upon request and provided to the project team. Separating the infrastructure into modular layers allows project teams to manage downstream layers like the database and service even if upstream layers are managed externally. In our example, if the VPC layer is provided by another department, the project team can skip using the network layer, or modify the network layer to build upon the externally provided VPC, and the project team need not refactor the rest of the infrastructure.

* **Out of band dependencies:** Some infrastructure resources depend on steps that take place outside of AWS and terraform in order to complete the creation for those layers, which makes it infeasible to rely on terraform's built-in resource dependency graphy to manage the creation of downstream resources. For example, creating an SSL/TLS certificate relies on an external step to verify ownership of the domain before it can be used by a downstream load balancer. As another example, after creating a database cluster, the database schemas, roles, and privileges need to be configured before they can be used by a downstream service. Separating infrastructure layers allows upstream dependencies to be fully created before attempting to create downstream dependent resources.

* **Mitigate risk of accidental changes:** Some layers, such as the network and database layers, aren't expected to change frequently, whereas the service layer is expected to change on every deploy in order to update the image tag in the task definition. Separating the layers reduces the risk of accidentally making changes to one layer when applying changes to another layer.

* **Speed of terraform plans:** The more resources are managed in a terraform state file, the more network calls terraform needs to make to AWS in order to fetch the current state of the infrastructure, which causes terraform plans to take more time. Separating out resources that rarely need to change improves the efficiency of making infrastructure changes.

## Links

* Based on [ADR-0005](./0005-separate-database-infrastructure-into-separate-layer.md)
* [Module architecture](/docs/infra/module-architecture.md)
