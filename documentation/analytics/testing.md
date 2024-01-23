# Testing

## Running tests

All tests are automatically run as part of the [`ci-analytics.yml` GitHub Action](../../.github/workflows/ci-analytics.yml) that is triggered each time changes are pushed to a pull request which modifies the `analytics` package.

These CI checks calls `make test-audit` which runs the unit tests and validates that test coverage is above 80% for the `analytics` package. During development, you can also use the following commands to run all or part of the test suite.

### Running all tests with coverage

Run `make unit-test` from the root of the `analytics/` sub-directory to run all unit tests and print out a test coverage report.

### Running specific set of tests

To have greater control over which tests are run, you'll need to use `poetry run pytest` to access the pytest command line. The following commands show you how to invoke progressively smaller subsets of tests:

- `poetry run pytest` Runs all tests automatically collected in [test discovery](https://docs.pytest.org/en/stable/goodpractices.html#conventions-for-python-test-discovery)
- `poetry run pytest tests/datasets/` Runs all collected tests in the
  `analytics/tests/datasets/` sub-directory
- `poetry run pytest tests/dataset/test_base.py` Runs all collected the tests in
  the `analytics/tests/datasets/test_base.py` file
- `poetry run pytest tests/dataset/test_sprint_board.py::TestSprintBoard` Runs
  all tests in the `TestSprintBoard` class in `test_base.py`

Visit the pytest docs for additional information about [testing invocation and usage](https://docs.pytest.org/en/6.2.x/usage.html).

### Using pytest flags

Each of the test execution commands above can be modified or extended with a series of flags. Pytest documentation has [the full list of flags available](https://docs.pytest.org/en/stable/reference/reference.html#command-line-flags), but some commonly used flags include:

- `-x` Stands for "exit first" and exits test execution as soon as a test fails
- `--lf` Stands for "last fail" and runs only the tests that failed during the most recent test execution
- `-v` Stands for "verbose" and prints out the name of each test being executed and whether it passed or failed
- `-vv` Stands for "very verbose" and prints out detailed diffs between actual and expected outputs for failed tests

## Writing tests

[pytest](https://docs.pytest.org) is our test runner, which is simple but powerful. If you are new to pytest, reading up on how [fixtures work](https://docs.pytest.org/en/latest/explanation/fixtures.html) in particular might be helpful as it's one area that is a bit different than is common with other runners (and languages).

### Naming

pytest automatically discovers tests by [following a number of conventions](https://docs.pytest.org/en/stable/goodpractices.html#conventions-for-python-test-discovery)
(what it calls "collection").

For this project specifically:

- All tests live under `analytics/tests/`
- Under `tests/`, the organization mirrors the source code structure
  - The tests for [`analytics/src/analytics/datasets/`](../../analytics/src/analytics/datasets/)
    are found at [`analytics/tests/datasets/`](../../analytics/tests/datasets/)
  - The tests for [`analytics/src/analytics/metrics/`](../../analytics/src/analytics/metrics/)
    are found at [`analytics/tests/metrics/`](../../analytics/tests/metrics/)
- Integration tests have their own dedicated `tests/integrations/` testing sub-directory
- Create `__init__.py` files for each directory. This helps [avoid name conflicts
  when pytest is resolving tests](https://docs.pytest.org/en/stable/goodpractices.html#tests-outside-application-code).
- Test files should begin with the `test_` prefix, followed by the module the tests
  cover, for example, a file `foo.py` will have tests in a file `test_foo.py`.
- Test cases should begin with the `test_` prefix, followed by the function it's
  testing and some description of what about the function it is testing.
  - In `tests/datasets/test_base/test_base.py`, the `test_to_and_from_csv`
    function is a test (because it begins with `test_`).
  - Tests can be grouped in classes starting with `Test`, methods that start with
    `test_` will be picked up as tests, for example `TestFeature::test_scenario`.

There are occasions where tests may not line up exactly with a single source file, function, or otherwise may need to deviate from this exact structure, but this is the setup in general.

> [!TIP]
> Try to use test names that describe the expected behavior or the conditions you are testing. For example, `test_return_none_if_no_matching_sprint_exists()` is preferable to `test_get_sprint_name()`.
>
> If you can't easily describe the conditions or behavior you're testing, you may need to break your function up into multiple smaller tests. One common pattern is to create a test class (e.g. `TestGetSprintNameFromDate`) that represents the method or function you're testing and then create a test method for each test scenario (e.g. `test_return_previous_sprint_if_date_is_start_of_next_sprint()`)

### conftest files

`conftest.py` files are automatically loaded by pytest, making their contents available to tests without needing to be imported. They are an easy place to put shared test fixtures as well as define other pytest configuration (define hooks, load plugins, define new/override assert behavior, etc.).

They should never be imported directly.

The main `tests/conftest.py` holds widely useful fixtures included for all tests. Scoped `conftest.py` files can be created that apply only to the tests below them in the directory hierarchy, for example, the `tests/datasets/conftest.py` file would only be loaded for tests under `tests/datasets/`.

[More info about conftest files](https://docs.pytest.org/en/latest/how-to/fixtures.html?highlight=conftest#scope-sharing-fixtures-across-classes-modules-packages-or-session)

### Testing helpers

If there is useful functionality that needs to be shared between tests, but is only applicable to testing and is not a fixture, create modules under `tests/helpers/`.

They can be imported into tests from the path `tests.helpers`, for example, `from tests.helpers.foo import helper_func`.

### Using factories

One of the more common use cases for helpers is generating factory functions or classes for test data that you want to use in your tests. Currently, the `analytics` package has a series of factory functions in `tests/helpers/factory.py`.

These factory functions (e.g. `json_issue_row()`) allow developers to generate rows of test data that are customized for the current test, while only declaring the test-specific fields:

```python
from tests.helpers.factor import (
    DAY_0,
    DAY_3,
    sprint_row,
)

def test_return_name_if_matching_sprint_exists():
    """Test that correct sprint is returned if date exists in a sprint."""
    # setup - create sample dataset
    board_data = [
        sprint_row(issue=1, sprint=1, sprint_start=DAY_0, sprint_length=3),
        sprint_row(issue=2, sprint=1, sprint_start=DAY_0, sprint_length=3),
        sprint_row(issue=3, sprint=2, sprint_start=DAY_3, sprint_length=3),
    ]
    # rest of the test below
    ...
```

### Debugging tests

As the test suite begins to grow, running the full suite can take an increasingly long time to complete, which makes quickly iterating and debugging individual tests harder to do. In order to speed up iteration, a common workflow to follow when developing or testing a new feature includes:

1. Create a new test (or modify an existing test) add `assert 0` at the bottom of the test to force it to fail.
2. Run the test suite once with the optional `-x` flag to exit test execution when the new (or modified) test fails.
3. Iterate on the code and quickly test changes by using the `--lf` flag to rerun just the last failed tests.
4. Once the test checks for the behavior we expect *and* it runs successfully until `assert 0`, we know that we've implemented the new feature correctly.
5. Remove `assert 0` from the test then re-run the full test suite (e.g. `poetry run pytest`) to ensure that all tests pass and there are no regressions.
