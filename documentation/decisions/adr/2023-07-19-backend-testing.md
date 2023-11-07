# Front-end Testing & Coverage

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-19 <!-- REQUIRED -->
- **Related Issue:** [174](https://github.com/HHS/simpler-grants-gov/issues/174) <!-- RECOMMENDED -->
- **Deciders:** Sammy Steiner, Lucas Brown, Billy Daly, Andy Cochran, Daphne Gold <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

Back-end testing is essential in maintaining a stable and healthy codebase, creating APIs without regression, and an important part of the developer workflow.

## Decision Drivers <!-- RECOMMENDED -->

- **Robust:** Chosen testing frameworks should have features that offer diverse ways of verifying back-end codebase functionality, reducing the need for intensive manual testing
- **Well-maintained:** Accessible tooling is well-maintained by owners and keeps up with current ecosystems in which it will be integrated.
- **Ease of use:** Achieving high coverage should be attainable. ICs should be able to onboard with the tooling and execute in a reasonable time frame to maintain that coverage.
- **Fast:** Running tests shouldn't take ages.

## Options Considered

## Unit Testing

- Pytest

## Test Coverage

- Coverage

### Pros and Cons of the Options <!-- OPTIONAL -->

#### [Pytest](https://docs.pytest.org/)

The pytest framework makes it easy to write small, readable tests, and can scale to support complex functional testing for applications and libraries.

- **Pros**
  - Lightweight, well-supported and documented testing solution
  - Already integrated in Flask back-end template
  - Modular fixtures for managing small or parametrized long-lived test resources
  - Can run [unittest](https://docs.python.org/3/library/unittest.html) (including trial) and nose test suites out of the box
  - Rich plugin architecture, with over 800+ external plugins and thriving community
- **Cons**
  - Compatibility issues with other testing frameworks means it's difficult to swap out for other frameworks

#### [Coverage](https://coverage.readthedocs.io/)

Coverage.py is a tool for measuring code coverage of Python programs. It monitors your program, noting which parts of the code have been executed, then analyzes the source to identify code that could have been executed but was not.

- **Pros**
  - Fully automated
- **Cons**
  - Code coverage is only one piece of a stable and healthy testing approach

## Decision Outcome <!-- REQUIRED -->

### Unit Testing

**Pytest**, because it is integrated into the Nava Flask template application, well-maintained, and lightweight. Importantly, documentation is thorough and helpful information for troubleshooting can be easily accessed.

### Testing Coverage

**Coverage**, because it is integrated into the Nava Flask template application, well-maintained, and lightweight. Importantly, documentation is thorough and helpful information for troubleshooting can be easily accessed.

We added a code coverage threshold of %80 in `api/pyproject.toml`
