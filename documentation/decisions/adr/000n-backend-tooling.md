# Back-end Code Quality Tools

- **Status:** Draft
- **Last Modified:** 2023-06-29
- **Related Issue:** [#101](https://github.com/HHS/grants-api/issues/101)
- **Deciders:** Aaron Couch, Daphne Gold, Sammy Steiner, Gina Carson, Lucas Brown, Billy Daly
- **Tags:** ADR

## Context and Problem Statement

{Describe the context and problem statement, e.g., in free form using two to three sentences. You may want to articulate the problem in form of a question.}

## Decision Drivers <!-- RECOMMENDED -->

- {driver 1, e.g., a constraint, priority, condition, etc.}
- {driver 2, e.g., a constraint, priority, condition, etc.}
- ...

## Options Considered
1. Use default packages integrated into temlate Flask application
2. Modify or add packages to template to suit our needs
### Code Linting
`make lint` runs ALL of the linters!

**flake:** Used to validate the format of our Python code. Configuration options can be found in [setup.cfg](/app/setup.cfg).  
**mypy:** Used to validate and enforce typechecking in python. Configuration options can be found in [pyproject.toml - tool.mypy](/app/pyproject.toml)  
**bandit:** Security checks

### Auto-formatting
`make format` runs ALL formatters!

**isort:** Used to sort our Python imports. Configuration options can be found in [pyproject.toml - tool.isort](/app/pyproject.toml)   
**black:** Used to format our Python code. Configuration options can be found in [pyproject.toml - tool.black](/app/pyproject.toml)

### Package Manager
Poetry

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### Use template defaults

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Modify template packages

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
