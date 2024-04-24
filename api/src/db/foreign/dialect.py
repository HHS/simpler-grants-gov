#
# Support for generating SQL for "CREATE FOREIGN TABLE".
#

import re
from typing import Any

import sqlalchemy
import sqlalchemy.dialects.postgresql


class ForeignTableDDLCompiler(sqlalchemy.sql.compiler.DDLCompiler):
    """SQLAlchemy compiler for creating foreign tables."""

    def create_table_constraints(
        self, _table: Any, _include_foreign_key_constraints: Any = None, **kw: Any
    ) -> str:
        return ""  # Don't generate any constraints.

    def visit_create_table(self, create: Any, **kw: Any) -> str:
        table = create.element
        table._prefixes = ("FOREIGN",)  # Add "FOREIGN" before "TABLE".
        sql = super().visit_create_table(create, **kw)
        table._prefixes = ()
        return sql

    def post_create_table(self, table: Any) -> str:
        # Add foreign options at the end.
        return f" SERVER grants OPTIONS (schema 'EGRANTSADMIN', table '{table.name.upper()}')"

    def visit_create_column(self, create: Any, first_pk: bool = False, **kw: Any) -> str:
        column = create.element
        sql = super().visit_create_column(create, first_pk, **kw)
        if sql and column.primary_key:
            # Add "OPTIONS ..." to primary key column.
            sql = re.sub(r"^(.*?)( NOT NULL)?$", r"\1 OPTIONS (key 'true')\2", sql)
        return sql


class ForeignTableDialect(sqlalchemy.dialects.postgresql.dialect):
    """SQLAlchemy dialect for creating foreign tables.

    See https://docs.sqlalchemy.org/en/20/dialects/
    """

    ddl_compiler = ForeignTableDDLCompiler
