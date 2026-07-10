#
# Support for generating SQL for "CREATE FOREIGN TABLE".
#
# mypy: ignore-errors

import re

import sqlalchemy
import sqlalchemy.dialects.postgresql

from src.db.extension.sqlalchemy_column import StripZerosText


class ForeignTableDDLCompiler(sqlalchemy.sql.compiler.DDLCompiler):
    """SQLAlchemy compiler for creating foreign tables."""

    def create_table_constraints(self, _table, _include_foreign_key_constraints=None, **kw):
        return ""  # Don't generate any constraints.

    def visit_create_table(self, create, **kw):
        table = create.element
        table._prefixes = ("FOREIGN",)  # Add "FOREIGN" before "TABLE".
        sql = super().visit_create_table(create, **kw)
        table._prefixes = ()
        return sql

    def post_create_table(self, table):
        # Add foreign options at the end.
        return (
            f" SERVER grants OPTIONS (schema 'EGRANTSADMIN', table '{table.name.upper()}', "
            "readonly 'true', prefetch '1000')"
        )

    def visit_create_column(self, create, first_pk=False, **kw):
        column = create.element
        sql = super().visit_create_column(create, first_pk, **kw)

        if not sql:
            return sql

        options = []
        if column.primary_key:
            options.append("key 'true'")

        if isinstance(column.type, StripZerosText):
            options.append("strip_zeros 'true'")

        if len(options) > 0:
            # Add "OPTIONS ..." to primary key column.
            option_str = f" OPTIONS ({(", ".join(options))})"

            sql = re.sub(r"^(.*?)( NOT NULL)?$", rf"\1{option_str}\2", sql)

        return sql


class ForeignTableDialect(sqlalchemy.dialects.postgresql.dialect):
    """SQLAlchemy dialect for creating foreign tables.

    See https://docs.sqlalchemy.org/en/20/dialects/
    """

    ddl_compiler = ForeignTableDDLCompiler
