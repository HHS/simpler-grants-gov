# Writing Tests

[pytest](https://docs.pytest.org) is our test runner, which is simple but
powerful. If you are new to pytest, reading up on how [fixtures
work](https://docs.pytest.org/en/latest/explanation/fixtures.html) in particular might be
helpful as it's one area that is a bit different than is common with other
runners (and languages).

## Naming

pytest automatically discovers tests by [following a number of
conventions](https://docs.pytest.org/en/stable/goodpractices.html#conventions-for-python-test-discovery)
(what it calls "collection").

For this project specifically:

- All tests live under `api/tests/`
- Under `tests/`, the organization mirrors the source code structure
  - The tests for `api/src/route/` are found at `api/test/api/route/`
- Create `__init__.py` files for each directory. This helps [avoid name
  conflicts when pytest is resolving
  tests](https://docs.pytest.org/en/stable/goodpractices.html#tests-outside-application-code).
- Test files should begin with the `test_` prefix, followed by the module the
  tests cover, for example, a file `foo.py` will have tests in a file
  `test_foo.py`.
- Test cases should begin with the `test_` prefix, followed by the function it's
  testing and some description of what about the function it is testing.
  - In `tests/api/route/test_healthcheck.py`, the `test_get_healthcheck_200` function is a test
    (because it begins with `test_`), that covers the `healthcheck_get` function's
    behavior around 201 responses.
  - Tests can be grouped in classes starting with `Test`, methods that start
    with `test_` will be picked up as tests, for example
    `TestFeature::test_scenario`.

There are occasions where tests may not line up exactly with a single source
file, function, or otherwise may need to deviate from this exact structure, but
this is the setup in general.

## conftest files

`conftest.py` files are automatically loaded by pytest, making their contents
available to tests without needing to be imported. They are an easy place to put
shared test fixtures as well as define other pytest configuration (define hooks,
load plugins, define new/override assert behavior, etc.).

They should never be imported directly.

The main `tests/conftest.py` holds widely useful fixtures included for all
tests. Scoped `conftest.py` files can be created that apply only to the tests
below them in the directory hierarchy, for example, the `tests/db/conftest.py`
file would only be loaded for tests under `tests/db/`.

[More info](https://docs.pytest.org/en/latest/how-to/fixtures.html?highlight=conftest#scope-sharing-fixtures-across-classes-modules-packages-or-session)


## Helpers

If there is useful functionality that needs to be shared between tests, but is
only applicable to testing and is not a fixture, create modules under
`tests/helpers/`.

They can be imported into tests from the path `tests.helpers`, for example,
`from tests.helpers.foo import helper_func`.

## Using Factories

To facilitate easier setup of test data, most database models have factories via
[factory_boy](https://factoryboy.readthedocs.io/) in
`api/src/db/models/factories.py`.

There are a few different ways of [using the
factories](https://factoryboy.readthedocs.io/en/stable/#using-factories), termed
"strategies": build, create, and stub. Most notably for this project:

- The build strategy via `FooFactory.build()` populates a model class with the
  generated data, but does not attempt to write it to the database
- The create strategy via `FooFactory.create()` writes a generated model to the
  database (can think of it like `FooFactory.build()` then `db_session.add()`
  and `db_session.commit()`)

The build strategy is useful if the code under test just needs the data on the
model and doesn't actually perform any database interactions.

In order to use the create strategy, pull in the `initialize_factories_session`
fixture.

Regardless of the strategy, you can override the values for attributes on the
generated models by passing them into the factory call, for example:

```python
FooFactory.build(foo_id=5, name="Bar")
```

would set `foo_id=5` and `name="Bar"` on the generated model, while all other
attributes would use what's configured on the factory class.
