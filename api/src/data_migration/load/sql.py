#
# SQL building for data load process.
#

import sqlalchemy


def build_insert_select_sql(
    source_table: sqlalchemy.Table, destination_table: sqlalchemy.Table
) -> tuple[sqlalchemy.Insert, sqlalchemy.Select]:
    """Build an `INSERT INTO ... SELECT ... FROM ...` query for new rows."""

    all_columns = tuple(c.name for c in source_table.columns)

    # `SELECT col1, col2, ..., FALSE FROM <source_table>`    (the FALSE is for is_deleted)
    select_sql = sqlalchemy.select(source_table, False).where(
        # `WHERE (id1, id2, id3, ...) NOT IN`    (id1, id2, ... is the multipart primary key)
        sqlalchemy.tuple_(*source_table.primary_key.columns).not_in(
            # `(SELECT (id1, id2, id3, ...) FROM <destination_table>)`    (subquery)
            sqlalchemy.select(destination_table.primary_key.columns)
        )
    )
    # `INSERT INTO <destination_table> (col1, col2, ..., is_deleted) SELECT ...`
    insert_from_select_sql = sqlalchemy.insert(destination_table).from_select(
        all_columns + (destination_table.c.is_deleted,), select_sql
    )

    return insert_from_select_sql, select_sql


def build_update_sql(
    source_table: sqlalchemy.Table, destination_table: sqlalchemy.Table
) -> sqlalchemy.Update:
    """Build an `UPDATE ... SET ... WHERE ...` statement for updated rows."""
    return (
        sqlalchemy.update(destination_table)
        .where(
            source_table.c.opportunity_id == destination_table.c.opportunity_id,
            destination_table.c.last_upd_date < source_table.c.last_upd_date,
        )
        .values(source_table.columns)
        .values(transformed_at=None)
    )
