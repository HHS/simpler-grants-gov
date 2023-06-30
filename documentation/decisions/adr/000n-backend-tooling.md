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
- **Enforces security:** Tooling should assist us in identifying security concerns and vulnerabilities.
- **Well-maintained:** We have a preference towards libraries that are widely adopted and have active maintainers.

## Options Considered

1. Use a curated collection of Python libraries (described below)
2. Use a different or modified set of Python libraries

### Dependency Management

**[Poetry](https://python-poetry.org/docs/):** Python packaging and dependency management.  
### Code Linting

**[Flake8](https://flake8.pycqa.org/en/latest/#):** Format and enforce style in our Python code.  

*Additional Flake Extensions:*
- [bugbear](https://pypi.org/project/flake8-bugbear/) for finding likely bugs and design problems.
- [alfred](https://pypi.org/project/flake8-alfred/) for finding unsafe/obsolete symbols.

### Auto-formatting

**[isort](https://pycqa.github.io/isort/):** Sort Python imports.  

**[Black](https://github.com/psf/black):** Format Python code.  

### Type Checking

**[Mypy](https://mypy-lang.org/):** Validate and enforce static type checking in Python.  
### Security

**[Bandit](https://bandit.readthedocs.io/en/latest/):** Security checking tool used to identify common concerns in Python code.  

**[Safety](https://docs.pyup.io/docs/getting-started-with-safety-cli):** Safety first! Safety scans dependencies for vulnerabilities and security concerns.[^*]  

### License Checking[^*]

**[pip-licenses](https://github.com/raimon49/pip-licenses):** CLI tool for checking the software license of installed Python packages with `pip`.  

### Interface

**[Make](https://www.gnu.org/software/make/manual/make.html):** Run scripts, linters and formatters.  

## Decision Outcome <!-- REQUIRED -->

TBD.

## Other Options

Adopting [Tox](https://tox.wiki/en/latest/) as a testing / linting manager with some of the libraries.

**Dependency Management:**  
[Pipenv](https://pipenv.pypa.io/en/latest/)

**Code Linting:**  
[Ruff](https://github.com/astral-sh/ruff) was also considered as an option for its speed and growing community adoption.  
[Pylint](https://pypi.org/project/pylint/)

**Auto-formatting:**  
[autopep8](https://pypi.org/project/autopep8/)

**Type Checking:**  
[Pyright](https://microsoft.github.io/pyright/#/)  
[Pyre](https://pyre-check.org/)

**Security:**  
[dependency-check](https://pypi.org/project/dependency-check/)

**License Checking:**  
[licensecheck](https://pypi.org/project/licensecheck/)

**Interface:**  
Bash, Poetry

[^*]: Addition to the existing curated collection