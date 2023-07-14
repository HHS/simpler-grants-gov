# Recording Architecture Decisions

- **Status:** Accepted
- **Last Modified:** 2023-06-26
- **Related Issue:** [#34](https://github.com/HHS/grants-api/issues/34)
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly
- **Tags:** ADRs

## Context and Problem Statement

Important decisions about the structure of a codebase, the tools or platforms adopted, and the scope or vision of a product are made all throughout a project's lifecycle. Often these decisions are made and changed blindly with little record of why that decision was made, making it difficult for other collaborators and even the original decision makers to understand the justification behind that decision in the future.

_What is the best way to document key architectural decisions made within the project so that future contributors can understand the justification for those decisions?_

## Decision Drivers <!-- RECOMMENDED -->

- **Explicit:** Important decisions about the project architecture should be clear and unambiguous
- **Documented:** There should be a written record describing which decisions are made
- **Accessible:** Decision records should be centrally located, searchable, and accessible to non-technical audiences
- **Portable:** The decision records should be able to travel with the code when it's forked, cloned, etc.
- **Maintainable:** The system we adopt should be easy to maintain or amend as needed.
- **Publicly Documented:** Decisions should be part of the public record so that external stakeholders (including open source contributors) understand the rationale behind each decision.

## Options Considered

- ADRs in the repo `documentation/decisions/adr` folder
- Comments and docstrings in the code itself
- Articles in the project's Wiki

## Decision Outcome <!-- REQUIRED -->

Decisions will be documented using Architecture Decision Records (ADRs) as described by [Joel Parker Henderson](joel) and the [ADR GitHub organization](https://adr.github.io/). The template for this project's ADRs will be adapted from the [MADR template](adrs).

**NOTE:** We may want to revisit this decision to reconsider storing them in the Project Wiki once that wiki is established. Ideally ADRs could be drafted/edited and visible in the wiki but also synced with the repo -- some wiki solutions provide this option.

### Positive Consequences <!-- OPTIONAL -->

- ADRs travel with the repo when it's cloned, forked, etc.
- ADRs can be incorporated in the Issue and PR workflow
- Changes to ADRs will be listed in the project's commit history

### Negative Consequences <!-- OPTIONAL -->

- Certain urgent decisions may take longer to finalize if they need to be documented and agreed upon, slowing down the process of finalizing key decisions with the project
- Unless regularly maintained and complied with, it could be easy for the ADRs to become out of sync with the actual decisions made about the architecture
- If the project is organized as a set of microservices with different repositories, we'll have to decide whether to keep ADRs in a central repo or record those decisions in the repo to which they are relevant which may reduce discoverability and accessibility
- Non-technical users may have a more challenging time creating and editing ADRs if they are not familiar with Markdown or GitHub

## Pros and Cons of the Options <!-- OPTIONAL -->

### Comments and Docstrings

- **Pro**
  - Decisions live alongside the code that implements them
  - Docstrings travel with the code when it's forked, cloned, etc.
  - Changes to docstrings and comments are part of the commit history
- **Cons**
  - Not very accessible to non-technical audiences
  - Not centralized and difficult to search for
  - Hard to see the sequential evolution of decisions

### Project Wiki

Documenting decisions in the Wiki tab on the project repository in GitHub.

- **Pro**
  - Wikis are fairly searchable and accessible to non-technical audiences
- **Cons**
  - Wikis are not forked with the main repo
  - Changes to the Wiki aren't easily integrated with the PR and Issue workflow
  - Changes to the Wiki aren't a part of the project's commit history

## Links <!-- OPTIONAL -->

- [ADR GitHub Organization](adr)
- [Joel Parker Henderson's ADR repo](joel)
- [GitHub Blog - Why Write ADRs](github)

[adr]: https://adr.github.io/
[joel]: https://github.com/joelparkerhenderson/architecture-decision-record#what-is-an-architecture-decision-record
[madr]: https://adr.github.io/madr/#the-template
[github]: https://github.blog/2020-08-13-why-write-adrs/
