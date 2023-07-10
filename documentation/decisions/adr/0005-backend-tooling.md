# Back-end Code Quality Tools

- **Status:** Accepted
- **Last Modified:** 2023-07-07
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

1. Use a curated collection of Python libraries from Flask template repository (described below)
2. Use a different or modified set of Python libraries

### Dependency Management

**[Poetry](https://python-poetry.org/docs/):** Python packaging and dependency management.  
### Code Linting

**[Ruff](https://beta.ruff.rs/docs/):** An extremely fast Python linter, written in Rust. Preferred for its speed and growing community adoption.[^*]

### Auto-formatting

**[Black](https://github.com/psf/black):** Format Python code. Compatible with [Ruff](https://beta.ruff.rs/docs/faq/#is-ruff-compatible-with-black) out of the box, however, Ruff *may* replace the need for Black at some point. See this [issue](https://github.com/astral-sh/ruff/issues/1904).

### Type Checking

**[Mypy](https://mypy-lang.org/):** Validate and enforce static type checking in Python.  
### Security

**[Safety](https://docs.pyup.io/docs/getting-started-with-safety-cli):** Safety first! Safety scans dependencies for vulnerabilities and security concerns.[^*]  

### License Checking[^*]

**[pip-licenses](https://github.com/raimon49/pip-licenses):** CLI tool for checking the software license of installed Python packages with `pip`.  

### Interface

**[Make](https://www.gnu.org/software/make/manual/make.html):** Run scripts, linters and formatters.  

## Decision Outcome <!-- REQUIRED -->
Option #2 is preferred. We would like to use Ruff for linting and add some additional libraries for security and license checks.

We will be using the Flask template repository for initial project set up, which already relies on Flake8 and several additional extensions (bugbear, alfred, bandit) that would be redundant with Ruff. Some extra work will need to be done to migrate away from Flake8 and to Ruff without any regression. Recommend using [flake8-to-ruff](https://pypi.org/project/flake8-to-ruff/) to convert existing configuration. 

There are some additional packages that we desire to use that are not included in the Flask template: safety & pip-licenses. 

As we iterate on the tools that work for us, we would like to investigate a possible switch to Pyright in the future as well.
## Other Options

Adopting [Tox](https://tox.wiki/en/latest/) as a testing / linting manager with some of the libraries.

**Dependency Management:**  
[Pipenv](https://pipenv.pypa.io/en/latest/)

**Code Linting:**  
[Flake8](https://flake8.pycqa.org/en/latest/#): Much slower than Ruff. Requires additional extentions like [bugbear](https://pypi.org/project/flake8-bugbear/) that are built into Ruff.  
[Pylint](https://pypi.org/project/pylint/)

**Auto-formatting:**  
[autopep8](https://pypi.org/project/autopep8/)

**Type Checking:**  
[Pyright](https://microsoft.github.io/pyright/#/): [Comparison of MyPy and Pyright](https://github.com/microsoft/pyright/blob/main/docs/mypy-comparison.md). Language service through Pylance.  
[Pyre](https://pyre-check.org/)

**Security:**  
[Bandit](https://bandit.readthedocs.io/en/latest/): Security checking tool used to identify common concerns in Python code. Redundant because Ruff implements `flake8-bandit`.  
[dependency-check](https://pypi.org/project/dependency-check/)

**License Checking:**  
[licensecheck](https://pypi.org/project/licensecheck/)

**Interface:**  
Bash, Poetry

[^*]: Addition to the existing curated collection