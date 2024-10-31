from sqlalchemy import text

import pandas

from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlSprintModel(EtlDb):

    def sync_sprint(self, sprint_df: pandas.DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # insert dimensions
        sprint_id = self._insert_dimensions(sprint_df, ghid_map)
        if sprint_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if sprint_id is None:
            sprint_id, change_type = self._update_dimensions(sprint_df, ghid_map)

        return sprint_id, change_type


    def _insert_dimensions(self, sprint_df: pandas.DataFrame, ghid_map: dict) -> int:

        # get values needed for sql statement
        insert_values = {
            'ghid': sprint_df['sprint_ghid'],
            'name': sprint_df['sprint_name'],
            'start': sprint_df['sprint_start'],
            'end': sprint_df['sprint_end'],
            'duration': sprint_df['sprint_length'],
            'quad_id': ghid_map[entity.QUAD].get(sprint_df['quad_ghid']),
        }
        new_row_id = None

        # insert into dimension table: sprint
        cursor = self.connection()
        insert_sql = "insert into gh_sprint(ghid, name, start_date, end_date, duration, quad_id) values (:ghid, :name, :start, :end, :duration, :quad_id) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql), insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _update_dimensions(self, sprint_df: pandas.DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = sprint_df['sprint_ghid']
        new_name = sprint_df['sprint_name']
        new_start = sprint_df['sprint_start']
        new_end = sprint_df['sprint_end']
        new_duration = sprint_df['sprint_length']
        new_quad_id = ghid_map[entity.QUAD].get(sprint_df['quad_ghid'])
        new_values = (new_name, new_start, new_end, new_duration, new_quad_id)

        # select
        cursor = self.connection()
        select_sql = f"select id, name, start_date, end_date, duration, quad_id from gh_sprint where ghid = '{ghid}'"
        result = cursor.execute(text(select_sql),)
        sprint_id, old_name, old_start, old_end, old_duration, old_quad_id = result.fetchone()
        old_values = (old_name, old_start, old_end, old_duration, old_quad_id)

        # compare
        if sprint_id is not None:
            if new_values != old_values:
                change_type = EtlChangeType.UPDATE
                update_sql = f"update gh_sprint set name = '{new_name}', start_date = '{new_start}', end_date = '{new_end}', duration = {new_duration}, quad_id = :quad_id, t_modified = current_timestamp where id = {sprint_id}"
                update_values = {
                    'new_name': new_name,
                    'new_start': new_start,
                    'new_end': new_end,
                    'new_duration': new_duration,
                    'quad_id': new_quad_id,
                    'sprint_id': sprint_id,
                }
                result = cursor.execute(text(update_sql), update_values)
                self.commit(cursor)

        return sprint_id, change_type
