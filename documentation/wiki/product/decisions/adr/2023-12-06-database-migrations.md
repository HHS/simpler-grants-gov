# Database Migrations

- **Status:** Accepted
- **Last Modified:** 2023-12-06
- **Related Issue:** [#779](https://github.com/HHS/simpler-grants-gov/issues/779)
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner, Michael Chouinard
- **Tags:** Database, Backend

## Context and Problem Statement

We need a tool that can help manage the schema of our database, as well as make updates to the schema as we add more to it.

NOTE: At the time of writing this, the API already uses Alembic, and this document is more to describe why we use it, rather than to make a decision.

## Decision Drivers

- Ease of use: Creating new migrations should be easy and intuitive
- Maintenance effort: The tool should be easy to maintain as we add more to our database schema
- Minimizing risk: The tool should gracefully handle migration failures
- Cost: This tool should be cost effective

## Options Considered

- Alembic
- AWS Database Migration Service
- Django
- Flyway
- Liquibase

## Decision Outcome

Chosen option: Alembic, because it handles our known use cases, has minimal overhead, and is the go-to framework for the ORM we also use.

Any other option requires us to create migrations through a process that requires significantly more work,
either by manually making those files, or generating them with another tool. Alembic just reads the ORM models
we already are writing and generates the migrations for us.

### Positive Consequences

- *Ease of use*: Migrations are generated directly from our SQLAlchemy ORM models
- *Maintenance effort*: Migrations are generally uneventful to add, and just require running a single command to automatically generate
- *Minimizing risk*: Migrations are run in transactions, if any error occurs, they automatically roll back. If an issue occurs after the migration happens, a downgrade is generated for you as well to revert.
- *Cost*: Alembic is open source and free

### Negative Consequences

- *Maintenance effort*: Some advanced migration features may be more difficult to execute

## Pros and Cons of the Options

### Alembic

[Alembic](https://alembic.sqlalchemy.org/en/latest/) is a database migration tool that can generate database migrations from our [SQLAlchemy ORM](https://www.sqlalchemy.org/) schema. It is capable of [automatically detecting](https://alembic.sqlalchemy.org/en/latest/autogenerate.html#what-does-autogenerate-detect-and-what-does-it-not-detect) most common database modifications including table, column, and index additions.

The migration files Alembic generates each receive a unique identifier, and the only information it needs to track is the current one.
When you run the database migrations, it finds the file with the current id, and sees if any migration is derived from it, similar to a linked list.
If more than one file references the same migration (most commonly caused by two developers merging changes in quick succession), then Alembic will error when attempting to run the migrations, requiring someone to create a new merge migration and define the order.

When Alembic migrations fail, they do not commit any changes to the database.

See [database-management.md](/documentation/api/database/database-management.md) for some details on how we use Alembic in this environment

- **Pros**
  - Built specifically to work with SQLAlchemy, the ORM layer that we already use
  - Capable of automatically generating migrations for most common schema changes from our SQLAlchemy models, making most migrations zero effort
  - Migrations are generated locally by a developer, and can be run against your local database to test the changes
  - No cost, is an open source extension of SQLAlchemy which is also free
- **Cons**
  - There are some scenarios where Alembic cannot detect database changes like renaming a table or column - instead a developer would need to manually modify the migration to do the rename
  - Certain repeatable migrations (like updating functions, views, or triggers) aren't detected by default, but a [library](https://github.com/olirice/alembic_utils) exists which can detect and automate this for you.

### AWS Database Migration Service

[AWS Database Migration Service](https://aws.amazon.com/dms/) (DMS) is a tool for copying and converting your database.

- **Pros**
  - We already will be using DMS to copy data from the existing Oracle DB to our new Postgres DB which will require schema configuration to work
- **Cons**
  - Eventually we will no longer be copying data from the legacy Oracle DB to our DB, at which point we'd need to find a new migration approach
  - Local development would not be able to setup a database using AWS DMS, local testing of schema changes would require a separate local-only process
  - AWS DMS is opinionated on database types in ways that conflict with Postgres documentation. For example, DMS largely prefers using VARCHAR for any string column despite [Postgres docs](https://www.postgresql.org/docs/current/datatype-character.html) saying TEXT and VARCHAR are the same performance-wise. While you can convert with AWS DMS, this adds additional overhead to a very common column type.

### Django

The Django framework comes with its own [migration process](https://docs.djangoproject.com/en/4.2/topics/migrations/).

- **Pros**
  - Provides a way to [squash migrations](https://docs.djangoproject.com/en/5.0/topics/migrations/#squashing-migrations) as they build up over time
  - Thoroughly integrated with the Django framework with lots of customization possible
- **Cons**
  - We would need to switch our API stack to use Django, see [API Framework](./2023-07-07-api-framework.md) for further details on this decision process

### Flyway

[Flyway](https://flywaydb.org/) is a Java-based application that manages running SQL migrations.

- **Pros**
  - [Supports](https://documentation.red-gate.com/flyway/flyway-desktop/database-devops-practices) a variety of deployment approaches, and version controls
- **Cons**
  - Creating new migrations requires using their Flyway Desktop application to generate the migration files which is another tool we would need to learn
  - Has cost tiers depending on your organization size

### Liquibase

[Liquibase](https://www.liquibase.com/) is Java-based application that manages running SQL migrations.

- **Pros**
  - Allows you to configure your migrations in XML, JSON, or YAML, not just raw SQL
  - Thorough [documentation](https://docs.liquibase.com/start/home.html)
- **Cons**
  - While it has a free open-source version, many key features like rollbacks look to be locked behind the Pro version
