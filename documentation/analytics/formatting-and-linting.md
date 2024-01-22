# Formatting and Linting

## Running the checks

Run `make lint` from the root of the `analytics/` package to run all of the linters and formatters.

This command is also run as part of the [GitHub action](../../.github/workflows/ci-analytics.yml) that is triggered each time changes are pushed to a pull request that modifies the analytics package.

## Linting

### Ruff

[ruff](https://flake8.pycqa.org/en/latest/) is used to enforce a set of best practices for our Python code. Configuration options can be found in [pyproject.toml - tool.ruff](../../analytics/pyproject.toml).

> [!NOTE]
> We currently enforce [all of ruff's rules](https://docs.astral.sh/ruff/rules/) with just a few exceptions. If we find that the current selection of rules is too cumbersome to adhere to, we can [change which rules are enforced](https://docs.astral.sh/ruff/linter/#rule-selection).

### Pylint

[pylint](https://pylint.readthedocs.io/en/latest/) is used to enforce rules that [ruff doesn't currently support](https://docs.astral.sh/ruff/faq/#how-does-ruffs-linter-compare-to-pylint). Configuration options can be found in [pyproject.toml - tool.pylint](../../analytics/pyproject.toml).

> [!NOTE]
> Currently we run both ruff and pylint for greater code quality coverage, however, ruff is [implementing more of pylint's rule set](https://github.com/astral-sh/ruff/issues/970). Because ruff is so much faster than pylint, once we consider the overlap between ruff and pylint's rule sets sufficient, we can drop pylint from our list of linters.

### Mypy

[mypy](https://mypy.readthedocs.io/en/stable/) is used to validate and enforce typechecking in python. Configuration options can be found in [pyproject.toml - tool.mypy](../../analytics/pyproject.toml). Type annotations are also enforced with ruff's replacement for the [flake8-annotations rule set](https://docs.astral.sh/ruff/rules/#flake8-annotations-ann).

## Formatting

### Black

[black](https://black.readthedocs.io/en/stable/) is used to format our Python code. Configuration options can be found in [pyproject.toml - tool.black](../../analytics/pyproject.toml). If developers are using VSCode, the `analytics` package also contains a [settings configuration file](../../analytics/.vscode/settings.json) that automatically run black when a file is saved.

### Sorting imports

Rather than installing [isort](https://pycqa.github.io/isort/) separately to sort imports, the `analytics` package uses [ruff's isort rule set](https://docs.astral.sh/ruff/rules/#isort-i) to automatically fix the import order.
