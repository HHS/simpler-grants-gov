"""Defines EtlQuadModel class to encapsulate db CRUD operations."""

from datetime import datetime

from pandas import Series
from sqlalchemy import text

from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb


class EtlQuadModel:
    """Encapsulates CRUD operations for quad entity."""

    def __init__(self, dbh: EtlDb) -> None:
        """Instantiate a class instance."""
        self.dbh = dbh

    def sync_quad(self, quad_df: Series) -> tuple[int | None, EtlChangeType]:
        """Write quad data to etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # insert dimensions
        quad_id = self._insert_dimensions(quad_df)
        if quad_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, then select and update
        if quad_id is None:
            quad_id, change_type = self._update_dimensions(quad_df)

        return quad_id, change_type

    def _insert_dimensions(self, quad_df: Series) -> int | None:
        """Write quad dimension data to etl database."""
        # insert into dimension table: quad
        new_row_id = None
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "insert into gh_quad(ghid, name, start_date, end_date, duration) "
                "values (:ghid, :name, :start_date, :end_date, :duration) "
                "on conflict(ghid) do nothing returning id",
            ),
            {
                "ghid": quad_df["quad_ghid"],
                "name": quad_df["quad_name"],
                "start_date": quad_df["quad_start"],
                "end_date": quad_df["quad_end"],
                "duration": quad_df["quad_length"],
            },
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.dbh.commit(cursor)

        return new_row_id

    def _update_dimensions(self, quad_df: Series) -> tuple[int | None, EtlChangeType]:
        """Update quad dimension data in etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # get new values
        new_values = (
            quad_df["quad_name"],
            quad_df["quad_start"],
            quad_df["quad_end"],
            int(quad_df["quad_length"]),
        )

        # select old values
        quad_id, old_name, old_start, old_end, old_duration = self._select(
            quad_df["quad_ghid"],
        )
        old_values = (
            old_name,
            old_start.strftime(self.dbh.dateformat) if old_start is not None else None,
            old_end.strftime(self.dbh.dateformat) if old_end is not None else None,
            old_duration,
        )

        # compare
        if quad_id is not None and new_values != old_values:
            change_type = EtlChangeType.UPDATE
            cursor = self.dbh.connection()
            cursor.execute(
                text(
                    "update gh_quad set name = :new_name, "
                    "start_date = :new_start, end_date = :new_end, "
                    "duration = :new_duration, t_modified = current_timestamp "
                    "where id = :quad_id",
                ),
                {
                    "new_name": new_values[0],
                    "new_start": new_values[1],
                    "new_end": new_values[2],
                    "new_duration": new_values[3],
                    "quad_id": quad_id,
                },
            )
            self.dbh.commit(cursor)

        return quad_id, change_type

    def _select(self, ghid: str) -> tuple[
        int | None,
        str | None,
        datetime | None,
        datetime | None,
        int | None,
    ]:
        """Select epic data from etl database."""
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "select id, name, start_date, end_date, duration "
                "from gh_quad where ghid = :ghid",
            ),
            {"ghid": ghid},
        )
        row = result.fetchone()
        if row:
            return row[0], row[1], row[2], row[3], row[4]

        return None, None, None, None, None
