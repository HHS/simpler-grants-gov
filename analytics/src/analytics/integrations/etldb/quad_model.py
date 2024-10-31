from sqlalchemy import text

import pandas

from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlQuadModel(EtlDb):

    def sync_quad(self, quad_df: pandas.DataFrame) -> (int, EtlChangeType):

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


    def _insert_dimensions(self, quad_df: pandas.DataFrame) -> int:

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
        insert_sql = "insert into gh_quad(ghid, name, start_date, end_date, duration) values (:ghid, :name, :start_date, :end_date, :duration) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql), insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _update_dimensions(self, quad_df: pandas.DataFrame) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        dateformat = "%Y-%m-%d"
        new_name = quad_df['quad_name']
        new_start = quad_df['quad_start']
        new_end = quad_df['quad_end']
        new_duration = int(quad_df['quad_length'])
        new_values = (new_name, new_start, new_end, new_duration)

        # select
        cursor = self.connection()
        select_sql = "select id, name, start_date, end_date, duration from gh_quad where ghid = ghid"
        result = cursor.execute(text(select_sql),)
        quad_id, old_name, old_start, old_end, old_duration = result.fetchone()
        old_values = (old_name, old_start.strftime(dateformat), old_end.strftime(dateformat), old_duration)

        # compare
        if quad_id is not None:
            if new_values != old_values:
                change_type = EtlChangeType.UPDATE
                update_sql = f"update gh_quad set name = '{new_name}', start_date = '{new_start}', end_date = '{new_end}', duration = {new_duration}, t_modified = current_timestamp where id = :quad_id"
                update_values = {
                    'new_name': new_name,
                    'new_start': new_start,
                    'new_end': new_end,
                    'new_duration': new_duration,
                    'quad_id': quad_id,
                }
                result = cursor.execute(text(update_sql), update_values)
                self.commit(cursor)

        return quad_id, change_type
