# Testing with the Database

This document describes how the database is managed in the test suite.

## Test Schema

The test suite creates a new PostgreSQL database schema separate from the `public` schema that is used by the application outside of testing. This schema persists throughout the testing session is dropped at the end of the test run. The schema is created by the `db` fixture in [conftest.py](../../../api/tests/conftest.py). The fixture also creates and returns an initialized instance of the [db.DBClient](../../../api/src/db/__init__.py) that can be used to connect to the created schema.

Note that [PostgreSQL schemas](https://www.postgresql.org/docs/current/ddl-schemas.html) are entirely different concepts from [Schema objects in OpenAPI specification](https://swagger.io/docs/specification/data-models/).

## Test Factories

The application uses [Factory Boy](https://factoryboy.readthedocs.io/en/stable/) to generate test data for the application. This can be used to create models `Factory.build` that can be used in any test, or to prepopulate the database with persisted models using `Factory.create`. In order to use `Factory.create` to create persisted database models, include the `enable_factory_create` fixture in the test.

