# Technical Overview

- [Key Technologies](#key-technologies)
- [Request operations](#request-operations)
- [Authentication](#authentication)
- [Authorization](#authorization)

## Key Technologies

The API is written in Python, utilizing APIFlask as the web application
framework (with Flask serving as the backend for APIFlask). The API is
described in the code via [Marshmallow Dataclasses](https://apiflask.com/schema/#use-dataclass-as-data-schema)

SQLAlchemy is the ORM, with migrations driven by Alembic. pydantic is used in
many spots for parsing data (and often serializing it to json or plain
dictionaries). Where pydantic is not used, plain Python dataclasses are
generally preferred.

- [OpenAPI Specification][oas-docs]
- [API Flask][apiflask-home] ([source code][apiflask-src])
- [SQLAlchemy][sqlalchemy-home] ([source code][sqlalchemy-src])
- [Alembic][alembic-home] ([source code](alembic-src))
- [pydantic][pydantic-home] ([source code][pydantic-src])
- [poetry](https://python-poetry.org/docs/) - Python dependency management

[oas-docs]: http://spec.openapis.org/oas/v3.0.3
[oas-swagger-docs]: https://swagger.io/docs/specification/about/

[apiflask-home]: https://apiflask.com/
[apiflask-src]: https://github.com/apiflask/apiflask

[pydantic-home]:https://pydantic-docs.helpmanual.io/
[pydantic-src]: https://github.com/samuelcolvin/pydantic/

[sqlalchemy-home]: https://www.sqlalchemy.org/
[sqlalchemy-src]: https://github.com/sqlalchemy/sqlalchemy

[alembic-home]: https://alembic.sqlalchemy.org/en/latest/

## Request operations

- TODO - redo this

## Authentication

Authentication methods are defined in the `security_scheme` config in
`app.py`. A particular security scheme is enabled for a route via a
`security` block on that route.

Flask runs the authentication method specified in `api_key_auth.py`
before passing the request to the route handler. 
In the `api_key` security scheme, the `X-Auth` points to the
function that is run to do the authentication.

## Authorization
n/a - Specific user authorization is not yet implemented for this API.

### Database diagram
n/a - Database diagrams are not yet available for this application.
