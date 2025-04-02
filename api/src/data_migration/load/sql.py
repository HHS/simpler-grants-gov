#
# SQL building for data load process.
#

from typing import Iterable

import sqlalchemy


def build_select_new_rows_sql(
    source_table: sqlalchemy.Table, destination_table: sqlalchemy.Table
) -> sqlalchemy.Select:
    """Build a `SELECT id1, id2, ... FROM <source_table>` query that finds new rows in source_table."""

    # `SELECT id1, id2, id3, ... FROM <source_table>`    (id1, id2, ... is the multipart primary key)
    return (
        sqlalchemy.select(*source_table.primary_key.columns)
        .where(
            # `WHERE (id1, id2, id3, ...) NOT IN`
            sqlalchemy.tuple_(*source_table.primary_key.columns).not_in(
                # `(SELECT (id1, id2, id3, ...) FROM <destination_table>)`    (subquery)
                sqlalchemy.select(*destination_table.primary_key.columns)
            )
        )
        .order_by(*source_table.primary_key.columns)
    )


def build_insert_select_sql(
    source_table: sqlalchemy.Table,
    destination_table: sqlalchemy.Table,
    ids: Iterable[tuple | sqlalchemy.Row],
    excluded_columns: list[str] | None = None,
) -> sqlalchemy.Insert:
    """Build an `INSERT INTO ... SELECT ... FROM ...` query for new rows."""

    if excluded_columns is None:
        excluded_columns = []

    columns_to_include = [c for c in source_table.columns if c.name not in excluded_columns]
    column_names = tuple(c.name for c in columns_to_include)

    # `SELECT col1, col2, ..., FALSE AS is_deleted FROM <source_table>`
    select_sql = sqlalchemy.select(
        *columns_to_include, sqlalchemy.literal_column("FALSE").label("is_deleted")
    ).where(
        # `WHERE (id1, id2, ...)
        #  IN ((a1, a2), (b1, b2), ...)`
        sqlalchemy.tuple_(*source_table.primary_key.columns).in_(ids),
    )
    # `INSERT INTO <destination_table> (col1, col2, ..., is_deleted) SELECT ...`
    insert_from_select_sql = sqlalchemy.insert(destination_table).from_select(
        column_names + (destination_table.c.is_deleted.name,), select_sql
    )

    return insert_from_select_sql


def build_select_updated_rows_sql(
    source_table: sqlalchemy.Table, destination_table: sqlalchemy.Table
) -> sqlalchemy.Select:
    """Build a `SELECT id1, id2, ... FROM <source_table>` query that finds updated rows in source_table. Excluded columns are not included in the query."""

    # `SELECT id1, id2, id3, ... FROM <destination_table>`
    return (
        sqlalchemy.select(*destination_table.primary_key.columns)
        .join(
            # `JOIN <source_table>
            #  ON (id1, id2, ...) = (id1, id2, ...)`
            source_table,
            sqlalchemy.tuple_(*destination_table.primary_key.columns)
            == sqlalchemy.tuple_(*source_table.primary_key.columns),
        )
        # `WHERE ...`
        # NOTE: The legacy system doesn't populate the last_upd_date unless at least one update
        #       has occurred, so we need to fallback to the created_date otherwise it will always be
        #       null on the destination table side
        .where(
            sqlalchemy.func.coalesce(
                destination_table.c.last_upd_date, destination_table.c.created_date
            )
            < source_table.c.last_upd_date
        )
        .order_by(*source_table.primary_key.columns)
    )


def build_update_sql(
    source_table: sqlalchemy.Table,
    destination_table: sqlalchemy.Table,
    ids: Iterable[tuple | sqlalchemy.Row],
    excluded_columns: list[str] | None = None,
) -> sqlalchemy.Update:
    """Build an `UPDATE ... SET ... WHERE ...` statement for updated rows."""

    if excluded_columns is None:
        excluded_columns = []

    # Create a dictionary of columns to update, excluding the excluded columns
    update_columns = {
        col.name: source_table.c[col.name]
        for col in source_table.columns
        if col.name not in excluded_columns
    }

    return (
        # `UPDATE <destination_table>`
        sqlalchemy.update(destination_table)
        # `SET col1=source_table.col1, col2=source_table.col2, ...`
        .values(update_columns)
        # `WHERE ...`
        .where(
            sqlalchemy.tuple_(*destination_table.primary_key.columns)
            == sqlalchemy.tuple_(*source_table.primary_key.columns),
            sqlalchemy.tuple_(*source_table.primary_key.columns).in_(ids),
        )
    )


def build_mark_deleted_sql(
    source_table: sqlalchemy.Table, destination_table: sqlalchemy.Table
) -> sqlalchemy.Update:
    """Build an `UPDATE ... SET is_deleted = TRUE WHERE ...` statement for deleted rows."""
    return (
        # `UPDATE <destination_table>`
        sqlalchemy.update(destination_table)
        # `SET is_deleted = TRUE`
        .values(is_deleted=True)
        # `WHERE`
        .where(
            # `is_deleted == FALSE`
            destination_table.c.is_deleted == False,  # noqa: E712
            # `AND (id1, id2, id3, ...) NOT IN`    (id1, id2, ... is the multipart primary key)
            sqlalchemy.tuple_(*destination_table.primary_key.columns).not_in(
                # `(SELECT (id1, id2, id3, ...) FROM <source_table>)`    (subquery)
                sqlalchemy.select(*source_table.primary_key.columns)
            ),
        )
    )
