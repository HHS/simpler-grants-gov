# Back-end Code Quality Tools

- **Status:** Draft
- **Last Modified:** 2023-06-29
- **Related Issue:** [#101](https://github.com/HHS/grants-api/issues/101)
- **Deciders:** Aaron Couch, Daphne Gold, Sammy Steiner, Gina Carson, Lucas Brown, Billy Daly
- **Tags:** ADR

## Context and Problem Statement

Back-end code quality tools should facilitate and efficiently enforce linting, auto-formatting, type-checking and security concerns. They should be easily configurable to suit our specific use-cases, uniformly applying conventions while alleviating the need for individual intervention.

## Decision Drivers <!-- RECOMMENDED -->

- **Ease of use and configurability:** Code quality tools should be configurable to meet the specific needs of our project and enforce standards uniformly. Running the tool should be simple, and feedback should be easily implementable and understandable.
- **Speed:** Code quality tools should be able to run in an timely manner, ideally in a pre-commit hook.
- **Documentation and resources:** Code quality tools should have robust and helpful documentation, specifically around usage and configuration.
- **Lean:** Selection of code quality tools should cover all use-cases with little overlap for ease of use and to minimize mental surface area required to understand the system. As in, each tool should have a specific, meaningful purpose.
- **Maintain security:** Tooling should assist us in identifying security concerns and vulnerabilities.

## Options Considered

1. Use a curated collection of Python libraries described below
2. Use a different or modified set of Python libraries

### Code Linting

**Flake8:** Format and enforce style in our Python code.  
[Flake8 documentation](https://flake8.pycqa.org/en/latest/#)  
[Flake8 configuration](https://flake8.pycqa.org/en/latest/user/configuration.html)  
*Additional Flake Extensions:*
- [bugbear](https://pypi.org/project/flake8-bugbear/) for finding likely bugs and design problems.
- [alfred](https://pypi.org/project/flake8-alfred/) for finding unsafe/obsolete symbols.

### Security
**Bandit:** Security checking tool used to identify common concerns in Python code.  
[Bandit documentation](https://bandit.readthedocs.io/en/latest/)  
[Bandit configuration](https://bandit.readthedocs.io/en/latest/config.html)

**Safety:** Safety first! Safety scans dependencies for vulnerabilities and security concerns.[^*]  
[Safety documentation](https://docs.pyup.io/docs/getting-started-with-safety-cli)
### Type Checking

**Mypy:** Validate and enforce static type checking in Python.  
[Mypy documentation](https://mypy-lang.org/)

### Auto-formatting

**isort:** Sort Python imports.  
[isort documentation](https://pycqa.github.io/isort/)

**Black:** Format Python code.
[Black documentation](https://github.com/psf/black)

### Licensing[^*]
**pip-licenses:** CLI tool for checking the software license of installed Python packages with `pip`.
[pip-licenses documentation](https://github.com/raimon49/pip-licenses)

### Package Manager

**Poetry:** Python packaging and dependency management.  
[Poetry documentation](https://python-poetry.org/docs/)  
[Poetry configuration](https://python-poetry.org/docs/configuration/)

### Interface

**Make:** Run scripts, linters and formatters.  
[Make documentation](https://www.gnu.org/software/make/manual/make.html) 

## Decision Outcome <!-- REQUIRED -->

TBD. Preferred -- Option 1.

Other options included adopting [Tox](https://tox.wiki/en/latest/) as a testing / linting manager with some of the libraries. [Ruff](https://github.com/astral-sh/ruff) was also considered as an option for its speed and growing community adoption.

[^*]: Addition to the existing curated collection