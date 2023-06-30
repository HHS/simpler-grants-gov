# Back-end Code Quality Tools

- **Status:** Draft
- **Last Modified:** 2023-06-29
- **Related Issue:** [#101](https://github.com/HHS/grants-api/issues/101)
- **Deciders:** Aaron Couch, Daphne Gold, Sammy Steiner, Gina Carson, Lucas Brown, Billy Daly
- **Tags:** ADR

## Context and Problem Statement

Back-end code quality tools should facilitate and efficiently enforce linting, auto-formatting, type-checking and security concerns. They should be configurable

## Decision Drivers <!-- RECOMMENDED -->

- **ease of use and configurability**:
- **speed:**
- **documentation and resources:**

## Options Considered
1. Use a curated collection of Python libraries described below

2. Use a different set of Python libraries

### Code Linting

**flake:** Used to validate the format of our Python code. Configuration options can be found in [setup.cfg](/app/setup.cfg).  
**mypy:** Used to validate and enforce typechecking in python. Configuration options can be found in [pyproject.toml - tool.mypy](/app/pyproject.toml)  
**bandit:** Security checks

### Auto-formatting

**isort:** Used to sort our Python imports. Configuration options can be found in [pyproject.toml - tool.isort](/app/pyproject.toml)   
**black:** Used to format our Python code. Configuration options can be found in [pyproject.toml - tool.black](/app/pyproject.toml)

### Package Manager
Poetry

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

Other options included adopting [Tox](https://tox.wiki/en/latest/) as a testing / linting manager with some of the libraries. [Ruff](https://github.com/astral-sh/ruff) was also considered as an option for its speed and growing community adoption.