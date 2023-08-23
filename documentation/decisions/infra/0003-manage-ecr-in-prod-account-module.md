# Manage ECR in prod account module

* Status: accepted
* Deciders: @lorenyu @shawnvanderjagt @farrcraft @kyeah
* Date: 2022-10-07

## Context and Problem Statement

In a multi-account setup where there is one account per environment, where should the ECR repository live?

## Decision Drivers

* Minimize risk that the approach isn't acceptable with the agency given uncertainty around ability to provision accounts with the agency
* Desire an approach that can adapt equally well to a multi-account setup (with an account per environment) as well as to a single-account setup (with one account across all environments) or a two-account setup (with one account for prod and an account for non-prod)
* Desire an approach that can adapt to situations where there is more than one ECR repository i.e. a project with multiple deployable applications
* Simplicity

## Considered Options

* Separate `dist`/`build` account to contain the ECR repository and build artifacts
* Manage the ECR repository as part of the `prod` account
* Manage the ECR repository as part of the `dev` or `stage` account

## Decision Outcome

Manage the ECR repository(ies) as part of the prod account module, or for single-account setups, the single account module. Since there will always be a prod account, this approach should have minimal risk for not working for the agency, and will also work for projects that only have or need a single account.

## Discussion of alternative approach

However, if account management and creation was not an issue, it could be more elegant to have the production candidate build artifacts be managed in a separate `build` account that all environment accounts reference. This approach is described in the following references:

* [Medium article: Cross-Account Amazon Elastic Container Registry (ECR) Access for ECS](https://garystafford.medium.com/amazon-elastic-container-registry-ecr-cross-account-access-for-ecs-2f90fcb02c80)
* [AWS whitepaper - Recommended Accounts - Deployments](https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/deployments-ou.html)
