---
description: >-
  ADR deciding how many and which repositories we'll use for the SimplerGrant
  initiative.
---

# Repo organization

* **Status:** Accepted
* **Last Modified:** 2025-01-02
* **Related Issue:** [#3205](https://github.com/HHS/simpler-grants-gov/issues/3205)
* **Deciders:** Billy, Lucas, Matt&#x20;
* **Tags:** Repo

## Overview

### Problem Statement

We’ve described HHS/simpler-grants-gov as a “monorepo” but there are currently several other HHS repositories that also store code and track work related to the SimplerGrants initiative:

* https://github.com/HHS/simpler-grants-gov
* https://github.com/HHS/grants-product-and-delivery
* https://github.com/HHS/simpler-grants-pdf-builder
* https://github.com/HHS/nofo-transformation
* https://github.com/HHS/simpler-grants-analysis-funnel

We should adopt a more formal strategy for organizing our work and code within the SimplerGrants initiative and ensure that each repository has a clear purpose and structure.

### Decision Drivers

* **Limited overhead:** Minimize the amount of overhead required to manage code and track work related to the SimplerGrants initiative.
* **Internal code reusability:** We have the ability to reuse shared application logic across different components of our architecture.
* **Internal infra reusability:** We have the ability to reuse shared infrastructure across different components of our architecture.
* **Open source reusability:** Members of the open source community can reuse and extend parts of the SimplerGrants codebase or architecture for their own work.
* **Separation of concerns:** Teams working on various services within the SimplerGrants initiative can manage their code and work in ways that are loosely coupled with other parts of the SimplerGrants ecosystem.
* **Centralized view:** Program-level staff and leadership can monitor progress and track dependencies across the entire SimplerGrants initiative in a centralized way.
* **Access control:** We have fine-grained control over access to issues and other privileges in the code base.

### Options Considered

* **Monorepo:** All code and issues are migrated to HHS/simpler-grants-gov
* **2-3 top level repos:** Only maintain a few top-level repositories, one for work on simpler.grants.gov and one for work on SimplerNOFOs.
* **Repo per service:** Create separate repositories for subsets of the SimplerGrants architecture that can be maintained separately.

## Decision outcome

### Repos

Our current plan is to use the following repositories:

* **Code-heavy repositories**
  * [HHS/simpler-grants-gov](https://github.com/HHS/simpler-grants-gov): Manages code and issues for frontend, backend, and analytics for simpler.grants.gov.
  * [HHS/simpler-grants-pdf-builder](https://github.com/HHS/simpler-grants-pdf-builder): Manages code and issues for the NOFO builder.
  * [HHS/simpler-grants-protocol](https://github.com/HHS/simpler-grants-protocol): Manages the specification and developer tools for the shared grants protocol we're developing.
* **Planning-heavy repositories**
  * [HHS/grants-product-and-delivery](https://github.com/HHS/grants-product-and-delivery): Public repository for tracking “metawork” associated with managing the Simpler.Grants.gov workstream.
  * [HHS/nofo-transformation](https://github.com/HHS/nofo-transformation): Private repository for tracking “metawork” associated with managing the SimplerNOFOs workstream. Note: we recommend renaming this to HHS/simpler-nofos-product-and-delivery for symmetry

### Next steps

1. **Define the infrastructure-application contract:** More clearly define the “service contract” that applications hosted on the SimplerGrants AWS infrastructure must adhere to, so that the PDF builder codebase can be updated to adhere to that contract. Note: We recommend thinking creatively about what this service contract could look like. For example, Lucas floated the idea of having the PDF builder codebase publish a docker image to a registry that could be detected and deployed by infrastructure managed in HHS/simpler-grants-gov, rather than replicating and managing the full deployment pipeline across multiple repositories.
2. **Estimate the LOE for managing multiple repos:** In the process of defining the infrastructure-application contract, we should also estimate the level of effort required to support this contract across multiple repositories and estimate how that LOE would scale as the number of repositories increases.
3. **Research strategies for independent prod deployments from the same repo:** One of the big challenges of managing multiple applications from the same codebase that we discussed was the fact that HHS/simpler-grants-gov current ties production deployments together across all applications managed in the repo through GitHub releases. In order to meaningfully support multiple applications in the same repo, we should evaluate strategies for decoupling prod deployments from one another.
4. **Define criteria for creating distinct codebases and repos:** We should also more clearly define the criteria for deciding when to break off a subset of one application into a distinct “codebase” (i.e. sub-directory and CI/CD workflow) managed in the same repo, as well as criteria for deciding when to split code and/or tickets into a separate repository altogether.

### Positive Consequences

* Keeps NOFO builder production releases decoupled from the production releases in HHS/simpler-grants-gov, allowing the teams to have different cadences for development and deployments.
* Enables existing teams to largely continue working as they are now, avoiding (or at least deferring) the change management associated with consolidating all code into a single repository or splitting the existing code into multiple repositories.
* Encourages us to begin exploring how to simplify and decouple deployments between different services, even if they are managed in the same repository.

### Negative Consequences

* Will likely involve duplicating code and/or engineering effort to manage infrastructure and deployments across multiple repositories.
* Could result in codebase “drift” or discrepancies between code that is duplicated across multiple repositories.
* Makes it slightly more likely that the same engineering or design problem will be solved in different ways across the code.

## Evaluation

### Summary

* ✅ Full meets criterion (2 points)
* 🟡 Partially meets criterion (1 point
* ❌ Does not meet criterion (0 points)

| Criterion                           | Single monorepo | 2-3 top-level repos | Repo per service |
| ----------------------------------- | --------------- | ------------------- | ---------------- |
| Limited overhead                    | 🟡              | 🟡                  | ❌                |
| Internal application reusability    | ✅               | 🟡                  | 🟡               |
| Internal infrastructure reusability | ✅               | 🟡                  | ✅                |
| Open source reusability             | 🟡              | 🟡                  | ✅                |
| Separation of concerns              | 🟡              | ✅                   | ✅                |
| Centralized view                    | ✅               | ✅                   | 🟡               |
| Access control                      | ❌               | 🟡                  | ✅                |
| Total                               | 9               | 9                   | 10               |

### Single monorepo

{% hint style="info" %}
#### Bottom-line up front

A single monorepo is best if:

* We want to centralize management of code and work, prioritize internal re-usability, and minimize project overhead
* But we’re willing to compromise on having a clear separation of concerns, fine-tuned access control, and external re-usability
{% endhint %}

#### Strategy

Fully committing to a monorepo strategy would entail:

* Migrating all existing code (including NOFO builder and OSTP code) into sub-directories of the existing HHS/simpler-grants-gov repo.
* Creating and managing all future issues within HHS/simpler-grants-gov.
* Adopting use of labels to distinguish issues associated with a given service or team and changing GitHub project automations to only add issues to project boards based on labels (e.g. issues tagged with “NOFO-builder” go to the NOFO project board, issues tagged with “Simpler.Grants.gov” go to the Simpler.Grants.gov product backlog)
* Blocking the creation of any new GitHub repos related to the SimplerGrants initiative.

#### Pros & Cons

* **Pros**
  * Allows us to easily reuse infrastructure and other shared code across components of the SimplerGrants codebase.
  * Minimizes the overhead associated with managing shared code and resources across repositories.
  * Both internal and external users only need to reference a single repository to monitor all work and code related to the SimplerGrants initiative.
  * Decreases the likelihood of duplicating work or solving the same problem in different ways.
  * Easier to monitor and enforce certain code quality standards or practices across teams and services.
* **Cons**
  * Tracking all of the work across services as issues in the same repository would become difficult to manage. Searching, filtering, and organizing issues effectively could become challenging.
  * Limits our ability to control privileges effectively across sub-sections of the codebase, and/or introduces extra coordination costs. For example, asking just 1-2 admins to manage permissions for all teams operating out of the repository even if they belong to different vendors.
  * Limits ability to restrict read or write access to issues managed in the same repository, for example keeping tasks related to unpublished NOFOs private, while keeping tasks related to simpler.grants.gov site public.
  * Managing all of the code and tickets from the same repository may encourage a more monolithic application architecture with more tightly coupled services (i.e. [Conway’s law](https://www.splunk.com/en_us/blog/learn/conways-law.html)).
  * Different needs related to tracking work or managing code may lead to a proliferation of templates, labels, automations, etc. and/or cause additional friction over how the repository is managed.
  * Harder for open source contributors to “fork” or reuse only part of the SimplerGrants codebase.

### Few top-level repositories

{% hint style="info" %}
#### Bottom-line up front

Have just 2-3 top level repos is best if:

* We want to balance internal re-use and centralization with having a clear separation of concerns and permissions for 2-3 well defined workstreams or services.
* But we’re willing to compromise on external re-usability and some additional overhead.
{% endhint %}

#### Strategy

Organizing our work and code into 2-3 top-level repos focused on workstreams would entail:

* Establish a set of criteria for identifying a service that requires its own repository.
* Use that criteria to evaluate and clean up the existing repositories we have.
* Define a set of common requirements to share across repositories and a mechanism for enforcing those standards.
* Define a clear “contract” for the relationship between services and what a given service must provide to external consumers (similar to [Amazon’s former policy](https://gist.github.com/kislayverma/d48b84db1ac5d737715e8319bd4dd368))

#### Pros & Cons

* Pros
  * Balances the internal re-use and centralization of a mono-repo with the clear separation of concerns of having separate repos per service (for a minimal number of teams).
  * Works well if there are just a few distinct workstreams or teams that are working on distinct parts of the application infrastructure.
  * Makes it slightly easier for open source contributors to “fork” or re-use parts of the codebase, especially if their use cases map onto the distinct workstreams defined for the SimplerGrants initiative.
  * Enables a smoother transition to maintaining distinct repositories per service if the workstreams were to sub-divide into multiple agile teams.
* Cons
  * Doesn’t fully meet the needs around internal re-usability if the infrastructure we want to share needs to be shared across workstreams.
  * Inherits some of the coordination challenges of both a single monorepo and having a distinct repository per service.
  * Doesn’t fully meet the needs of fine-tuned access control if the needs around access need to be split within a given workstream (e.g. some tickets should be private, while others should be public).
  * Still limits external re-usability if the way we’re dividing workstreams doesn’t match the use case of other stakeholders in the open source community.

### Repo per service

{% hint style="info" %}
#### Bottom-line up front

Having a repo per service is best if:

* We want to establish a clear separation of concerns, maximize external re-usability of code, and have more fine-tuned control over access to code and issues.
* but we’re willing to compromise on the ability to share code within the same codebase and accept more overhead managing the project across repositories.
{% endhint %}

#### Strategy

* Establish a set of criteria for identifying a service that requires its own repository.
* Use that criteria to evaluate and clean up the existing repositories we have.
* Define a set of common requirements to share across repositories and a mechanism for enforcing those standards.
* Define a clear “contract” for the relationship between services and what a given service must provide to external consumers (similar to [Amazon’s former policy](https://gist.github.com/kislayverma/d48b84db1ac5d737715e8319bd4dd368))

#### Pros & Cons

* **Pros**
  * Grants teams more autonomy over how they organize and manage both their work and their code. Ideally helping reduce friction over how to manage a given repository.
  * Enables more fine-tuned access control over issues and code related to a given service.
  * Encourages teams to define and enforce clear interfaces and contracts between services promoting a more loosely coupled architecture (i.e. [Conway’s law](https://www.splunk.com/en_us/blog/learn/conways-law.html)).
  * Reduces the coordination cost and administrative burden placed on administrators of a given repository.
  * Makes it easier for external users to “fork” or re-use only a portion of the SimplerGrants codebase that is relevant to their use case.
* **Cons**
  * It may be hard to meaningfully define and identify what constitutes a “service” and deserves its own repository.
  * Increases the coordination cost for teams or program staff who need to manage work and code across multiple repositories (e.g. Platform team, OG PMO, etc.)
  * Makes it harder to re-use shared infrastructure or code across multiple repositories without turning those items into their own service.
  * Makes it harder to conduct meaningful integration or end-to-end testing without mocking services during development.
  * Makes it harder to monitor and enforce consistent code practices or standards across repositories.
  * Increases the likelihood of duplicating work or solving the same problem multiple times in different ways.
