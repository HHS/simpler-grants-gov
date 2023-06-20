# Developer Tools

| Field           | Value          |
| --------------- | -------------- |
| Document Status | Draft          |
| Epic Link       | TODO: Add Link |
| Epic Dashboard  | TODO: Add Link |
| Target Release  | TODO: Add Date |
| Product Owner   | Lucas Brown    |
| Document Owner  | Billy Daly     |
| Lead Developer  | TODO: Add Name |
| Lead Designer   | TODO: Add Name |

## Short description

Select and implement a set of developer tools that automate key code quality and security checks within the backend codebase.

## Goals

### Business description & value

We must incorporate an effective set of developer tools into our backend codebase to ensure that code contributions from maintainers (HHS staff members and contractors) and open source contributors meet key standards and do not introduce bugs or security vulnerabilities. 

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
  - ensure that new contributions meet certain thresholds for test coverage, so that code contributions from internal and external developers also include tests which validate the code's behavior
  - be automatically notified when updates are available for project dependencies, so that easily evaluate and adopt these new updates and ensure our dependencies don't become stale
  - be notified when a security vulnerability is detected in our project or in an upstream dependency, so we can work to quickly address the vulnerability and deploy a fix
  - securely manage and rotate keys and secrets related to the project, so that we minimize the risk of secrets being exposed or compromised

## Technical description

### Automated test framework

- Unit tests
- Integration tests
- Test coverage

### Code quality checks

- Code Linting
- Auto-formatting
- Type checking
- Commit conventions

### Security checks

- Secrets scanning
- Upstream CVE monitoring
- Vulnerability reporting mechanism

### Dependency management

- Dependency conflicts
- Dependency updates
- Dependency funding

### Config & secrets management

- Loading config variables
- Secrets storage & sharing
- Runtime injection

### Definition of done

- [ ] For all of the tools:
  - [ ] Code required to configure and run the tools is deployed to `main` & PROD
  - [ ] Instructions for how to adopt and use these tools is clearly documented in a public space
  - [ ] At least 5 internal developers/maintainers have adopted and run these tools on a cloned version of the repo
  - [ ] At least 3 open source contributors have adopted and run these tools on a forked version of the repo
- [ ] Automated testing framework is live and meets the following conditions:
  - [ ] At least 1 unit test has been added to the codebase
  - [ ] At least 1 integration test has been added to the codebase
  - [ ] Unit tests are run on every push to the remote GitHub repository
  - [ ] Integration tests are run at least once before merging new code into `main`
  - [ ] Code which fails any of the unit or integration tests will be blocked from merging into `main`
  - [ ] A report on the percentage of code covered by tests is available after every test run
  - [ ] Code whose test coverage falls below a certain threshold will be blocked from merging into `main`
- [ ] Code quality checks are live and meet the following conditions:
  - [ ] All checks are run on every push to the remote GitHub repository
  - [ ] The most important checks are run on every local commit
  - [ ] Code which fails any of these checks will be blocked from merging into `main`
- [ ] Security checks are live and meet the following conditions:
  - [ ] At least 1 (test) security vulnerability report has been submitted
  - [ ] Maintainers are notified within 1 hour of a vulnerability being reported within the grants API codebase
  - [ ] Maintainers are notified within 72 hours of a vulnerability being reported on an upstream dependency
  - [ ] Security checks are running on every push to the remote GitHub repository
  - [ ] Code which fails any of these security checks is blocked from merging into `main`

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
- Config & secrets management metric: Average age of across all tokens/secrets

### Destination for live updating metrics

Not yet known

## Planning

### Assumptions & dependencies

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [ ] **DB & API Plan:** Choosing a set of developer tools will be depend heavily on the language selected for the API.
- [ ] **Onboard Dev Team:** The dev team should be involved in the selection and implementation of these tools.

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- **CI/CD:** While the checks should run automatically each time code is pushed to GitHub, these checks will be incorporated more formally into a CI/CD pipeline in a separate milestone

### Open questions

- [ ] [to be added]

### Not doing

The following work will *not* be completed as part of this milestone:

1. [to be added]

## Integrations

### Translations

Does this milestone involve delivering any content that needs translation?

If so, when will English-language content be locked? Then when will translation be
started and completed?

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

1. None

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

1. None

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

1. None

### Security considerations


