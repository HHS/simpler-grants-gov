"""Defines EtlQuadModel class to encapsulate db CRUD operations"""

from sqlalchemy import text
from pandas import DataFrame
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlQuadModel(EtlDb):
    """Encapsulates CRUD operations for quad entity"""

    def sync_quad(self, quad_df: DataFrame) -> (int, EtlChangeType):
        """Write quad data to etl database"""

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


    def _insert_dimensions(self, quad_df: DataFrame) -> int:
        """Write quad dimension data to etl database"""

        # get values needed for sql statement
        insert_values = {
            'ghid': quad_df['quad_ghid'],
            'name': quad_df['quad_name'],
            'start_date': quad_df['quad_start'],
            'end_date': quad_df['quad_end'],
            'duration': quad_df['quad_length'],
        }
        new_row_id = None

        # insert into dimension table: quad
        cursor = self.connection()
        insert_sql = text(
            "insert into gh_quad(ghid, name, start_date, end_date, duration) "
            "values (:ghid, :name, :start_date, :end_date, :duration) "
            "on conflict(ghid) do nothing returning id"
        )
        result = cursor.execute(insert_sql, insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _update_dimensions(self, quad_df: DataFrame) -> (int, EtlChangeType):
        """Update quad dimension data in etl database"""

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        dateformat = "%Y-%m-%d"
        new_values = (
            quad_df['quad_name'],
            quad_df['quad_start'],
            quad_df['quad_end'],
            int(quad_df['quad_length']),
        )

        # select
        cursor = self.connection()
        result = cursor.execute(
            text(
                "select id, name, start_date, end_date, duration "
                "from gh_quad where ghid = :ghid"
            ),
            {
                'ghid': quad_df['quad_ghid']
            }
        )
        quad_id, old_name, old_start, old_end, old_duration = result.fetchone()
        old_values = (
            old_name,
            old_start.strftime(dateformat),
            old_end.strftime(dateformat),
            old_duration
        )

        # compare
        if quad_id is not None:
            if new_values != old_values:
                change_type = EtlChangeType.UPDATE
                cursor.execute(
                    text(
                        "update gh_quad set name = :new_name, start_date = :new_start, "
                        "end_date = :new_end, duration = :new_duration, "
                        "t_modified = current_timestamp "
                        "where id = :quad_id"
                    ),
                    {
                        'new_name': quad_df['quad_name'],
                        'new_start': quad_df['quad_start'],
                        'new_end': quad_df['quad_end'],
                        'new_duration': int(quad_df['quad_length']),
                        'quad_id': quad_id,
                    }
                )
                self.commit(cursor)

        return quad_id, change_type
