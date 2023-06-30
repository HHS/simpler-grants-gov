# Choose a Task Runner for the CI / CD Pipeline and Describe Interface

- **Status:** Draft <!-- REQUIRED -->
- **Last Modified:** 2023-06-29 <!-- REQUIRED -->
- **Related Issue:** [ADR: Task Runner and CI / CD interface #92
](https://github.com/HHS/grants-api/issues/92) <!-- RECOMMENDED -->
- **Deciders:** TBD <!-- REQUIRED -->
- **Tags:** Continuous Integration, Continuous Deployment <!-- OPTIONAL -->

## Context and Problem Statement

A task runner needs to be selected and an interface described to initiate tasks so that the project can perform necessary testing, linting, other continuous integration tasks, and continous deployment.

The task runner should be able to run on commits and pull requests and support both testing of code and deployment to various environments. The task runner should be able to run tasks within its own environment as well as initiate remote tasks.

## Decision Drivers <!-- RECOMMENDED -->

- ** speed **
- ** ease of use **
- ** available tooling **
- ** cost **
- ** security and authorization **

## Options Considered

- {option 1}
- {option 2}
- ...

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### {option 1}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### {option 2}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...
