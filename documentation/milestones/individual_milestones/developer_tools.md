# Developer Tools

| Field           | Value                                                                 |
| --------------- | --------------------------------------------------------------------- |
| Document Status | Completed                                                             |
| Epic Link       | [Issue 50](https://github.com/HHS/grants-equity/issues/50)            |
| Epic Dashboard  | [Milestones Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-07-19                                                            |
| Product Owner   | Lucas Brown                                                           |
| Document Owner  | Billy Daly                                                            |
| Lead Developer  | Aaron Couch                                                           |
| Lead Designer   | Andy Cochran                                                          |

## Short description

Select and implement a set of developer tools that automate key code quality and security checks within the backend and frontend codebases.

## Goals

### Business description & value

We must incorporate an effective set of developer tools into our codebase to ensure that code contributions from maintainers (HHS staff members and contractors) and from open source contributors meet key standards and do not introduce bugs or security vulnerabilities. 

While enforcing compliance with these standards may increase the time and energy required for individual contributions, adopting an effective set of tools can increase the speed of delivery over time by reducing the overhead associated with reviewing new code and identifying potential bugs before they are deployed to production.

### User stories

- As a **full-time HHS staff member**, I want to:
  - ensure that the codebase meets certain quality standards, so that it will be easier to onboard future maintainers and developers to the project
  - have a mechanism for catching potential code issues during development or code review, so that we are not introducing bugs or security vulnerabilities in production
- As an **open source contributor**, I want to:
  - be able to reference documentation explaining how to use the developer tools, so that I don't have to learn how to use these tools on my own in order to contribute to the project
  - have full test coverage for the codebase, so that I know when I've introduce code that changes or breaks existing behavior
  - have code formatting and standards enforced with automated tooling, so that I don't have to learn and check that my code adheres to those standards manually
  - be able to report security vulnerabilities to project maintainers directly, so that they can quickly create and deploy a fix before the vulnerability is made public
- As a **maintainer of the project**, I want to:
  - have code quality checks run automatically on each push, so that formatting, linting, or security issues are caught before being deployed to production
  - see visible metrics and indications of code quality adherence such as badges on documentation and color coded check marks attached to code updates, so that I know all of the important checks are passing
  - ensure that new contributions meet certain thresholds for test coverage, so that code contributions from internal and external developers also include tests which validate the code's behavior
  - be automatically notified when updates are available for project dependencies, so that easily evaluate and adopt these new updates and ensure our dependencies don't become stale
  - be notified when a security vulnerability is detected in our project or in an upstream dependency, so we can work to quickly address the vulnerability and deploy a fix
  - securely manage and rotate keys and secrets related to the project, so that we minimize the risk of secrets being exposed or compromised

## Technical description

### Automated test framework

Evaluate and adopt a framework to build and manage an automated test suite for the codebase. This test framework should include:

- Unit tests
- Integration tests
- Test coverage

### Code quality checks

Evaluate and adopt a set of tools to enforce the following code quality checks:

- Code Linting
- Auto-formatting
- Type checking

### Security checks

Evaluate and adopt a set of tools that enforce the following security checks:

- Secrets scanning
- Upstream CVE monitoring
- Vulnerability reporting mechanism

### Dependency management

Evaluate and adopt a tool for managing project dependencies that also tracks and helps resolve:

- Dependency conflicts
- Dependency updates
- Dependency licenses (e.g. if we want to avoid certain licenses)
- Dependency funding (e.g. which dependencies are requesting funding)

### Config & secrets management

Evaluate and adopt a set of tools that standardize and enforce best practices around secrets management in the project. This collection of tools should support: 

- Loading configs from environment variables or files (e.g. `secrets.toml`, `.env`, etc.)
- Secrets storage & sharing
- Runtime injection

### Definition of done

- [ ] For all of the tools:
  - [ ] Code required to configure and run the tools is deployed to `main` & PROD
  - [ ] Instructions for how to adopt and use these tools is clearly documented in a public space
  - [ ] At least 5 internal developers/maintainers have adopted and run these tools on a cloned version of the repo
  - [ ] At least 3 open source contributors have adopted and run these tools on a forked version of the repo
  - [ ] ADRs documenting the selection of these tools and standards have been created and approved
  - [ ] The status of key checks are reflected as badges in a project README
- [ ] **Automated testing framework** is live and meets the following conditions:
  - [ ] At least 1 unit test has been added to the codebase
  - [ ] At least 1 integration test has been added to the codebase
  - [ ] Unit tests are run on every push to the remote GitHub repository
  - [ ] Integration tests are run at least once before merging new code into `main`
  - [ ] Code which fails any of the unit or integration tests will be blocked from merging into `main`
  - [ ] A report on the percentage of code covered by tests is available after every test run
  - [ ] Code whose test coverage falls below a certain threshold will be blocked from merging into `main`
- [ ] **Code quality checks** are live and meet the following conditions:
  - [ ] All checks are run on every push to the remote GitHub repository
  - [ ] The most important checks are run on every local commit
  - [ ] Code which fails any of these checks will be blocked from merging into `main`
- [ ] **Security checks** are live and meet the following conditions:
  - [ ] At least 1 (test) security vulnerability report has been submitted
  - [ ] Maintainers are notified within 1 hour of a vulnerability being reported within the grants API codebase
  - [ ] Maintainers are notified within 72 hours of a vulnerability being reported on an upstream dependency
  - [ ] Security checks are running on every push to the remote GitHub repository
  - [ ] Code which fails any of these security checks is blocked from merging into `main`
- [ ] **Dependency management** is live and meets the following conditions:
  - [ ] At least 2 upstream dependencies have been added to the project
  - [ ] Compatible versions of upstream dependencies are automatically detected when a new dependency is added
  - [ ] Maintainers are notified when a new minor or major version of an upstream dependency is available
- [ ] **Config & secrets management** is live and meets the following conditions:
  - [ ] At least 1 configuration variable has been added to the project
  - [ ] This config variable has different values when it is running in different environments (e.g. dev, staging, and prod)
  - [ ] At least 2 internal developers can access a shared value of this variable locally
  - [ ] Developers can change the value of this config variable in their local environment without changing it for other developers
  - [ ] An integration test has been created to validate that this variable is injected at runtime

### Proposed metrics for measuring goals/value/definition of done

- Test framework metrics
  - Percentage of code covered by unit tests
  - Percentage of code covered by integration tests
  - Total runtime of all unit tests
  - Total runtime of all integration tests
- Code quality checks metric: Total runtime of all code quality checks
- Security checks metrics
  - Total runtime of all security checks
  - Number of security vulnerabilities not caught until production
  - Number of days it takes to resolve a security vulnerability reported in the grants API project
  - Number of days it takes to update an upstream dependency once a version which resolves a CVE has been released
- Dependency management metrics
  - Number of days it takes to update an upstream dependency once a new minor or major version has been released
  - Number of dependencies that received funding through this project
- Config & secrets management metric: Average age across all tokens/secrets

### Destination for live updating metrics

Not yet known

## Planning

### Assumptions & dependencies

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [ ] **API Plan & frontend Plan:** Choosing a set of developer tools for will be depend heavily on the language selected for both the backend and the frontend.
- [ ] **Onboard Dev Team:** The dev team should be involved in the selection and implementation of these tools.

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- **CI/CD:** While the checks should run automatically each time code is pushed to GitHub, these checks will be incorporated more formally into a CI/CD pipeline in a separate milestone
- **Internationalization:** While this milestone will involve content that needs to be translated, we are not likely to have the mechanism for supporting translation in place by the time work starts on this milestone.

### Open questions

- [x] None

### Not doing

The following work will *not* be completed as part of this milestone:

1. **Full CI/CD setup:** While we *do* want the code quality and security checks to be run on each push to GitHub, the task runner that orchestrates these checks does not need to be the full CI/CD pipeline that will also manage production deployments of the frontend or backend codebases.

## Integrations

### Translations

*Does this milestone involve delivering any content that needs translation?*

- Instructions for adopting and using developer tools
- Instructions for reporting security vulnerabilities

*If so, when will English-language content be locked? Then when will translation be started and completed?*

- Languages to support TBD
- Translation timeline TBD

### Services going into PROD for the first time

*This can include services going into PROD behind a feature flag that is not turned on.*

1. **Task Runner:** This milestone involves setting up a task runner for the repository that will execute a series of code quality and security checks for both the backend and frontend parts of the codebase
2. **Secrets Management:** This milestone includes setting up a service to manage secrets.

### Services being integrated in PROD for the first time

*Are there multiple services that are being connected for the first time in PROD?*

1. **Task Runner & Secrets Management:** In addition to deploying these services separately, this milestone should also support a strategy for injecting secrets into the task runner during the CI/CD pipeline for running integration tests.

### Data being shared publicly for the first time

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. None

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

**Secrets Management:** This milestone includes selecting and deploying a secrets management service, which introduces two potential attack vectors: 

1. Compromising the access to the secrets manager
2. Compromising individual secrets when they are injected

*If so, how are we addressing these risks?*

1. **Least Privileged Access:** Access to the secrets manager should follow the [principle of least privilege (POLP)](https://csrc.nist.gov/glossary/term/least_privilege)
2. **Rotating Keys/Tokens:** All secrets, keys, and tokens stored in the secrets manager should have expiration dates (where possible) and we should prioritize secrets managers that support dynamically rotating keys and secrets
3. **Runtime Injection:** Secrets should be injected as late as possible in any workflow that requires them, preferably at runtime
4. **Minimizing Secrets:** We should explore options that allow us to integrate services without relying on internally managed secrets, such as managed integrations between existing cloud services
