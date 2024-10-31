from sqlalchemy import text

from pandas import DataFrame

from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlEpicModel(EtlDb):

    def sync_epic(self, epic_df: DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # insert dimensions
        epic_id = self._insert_dimensions(epic_df)
        if epic_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if epic_id is None:
            epic_id, change_type = self._update_dimensions(epic_df)

        # insert facts
        if epic_id is not None:
            self._insert_facts(epic_id, epic_df, ghid_map)

        return epic_id, change_type


    def _insert_dimensions(self, epic_df: DataFrame) -> int:

        # get values needed for sql statement
        insert_values = {
            'ghid': epic_df['epic_ghid'],
            'title': epic_df['epic_title'],
        }
        new_row_id = None

        # insert into dimension table: epic
        cursor = self.connection()
        insert_sql = text(
            "insert into gh_epic(ghid, title) values (:ghid, :title) "
            "on conflict(ghid) do nothing returning id"
        )
        result = cursor.execute(insert_sql, insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _insert_facts(self, epic_id: int, epic_df: DataFrame, ghid_map: dict) -> int:

        # get values needed for sql statement
        insert_values = {
            'deliverable_id': ghid_map[entity.DELIVERABLE].get(epic_df['deliverable_ghid']),
            'epic_id': epic_id,
            'effective': self.effective_date,
        }
        new_row_id = None

        # insert into fact table: epic_deliverable_map
        cursor = self.connection()
        insert_sql = text(
            "insert into gh_epic_deliverable_map(epic_id, deliverable_id, d_effective) "
            "values (:epic_id, :deliverable_id, :effective) "
            "on conflict(epic_id, d_effective) do update "
            "set (deliverable_id, t_modified) = (:deliverable_id, current_timestamp) "
            "returning id"
        )
        result = cursor.execute(insert_sql, insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _update_dimensions(self, epic_df: DataFrame) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = epic_df['epic_ghid']
        new_title = epic_df['epic_title']

        # select
        cursor = self.connection()
        select_sql = text("select id, title from gh_epic where ghid = :ghid")
        select_values = { 'ghid': ghid }
        result = cursor.execute(select_sql, select_values)
        epic_id, old_title = result.fetchone()

        # compare
        if epic_id is not None:
            if (new_title, ) != (old_title, ):
                change_type = EtlChangeType.UPDATE
                update_sql = text(
                    "update gh_epic set title = :new_title, t_modified = current_timestamp "
                    "where id = :epic_id"
                )
                update_values = {
                    'new_title': new_title,
                    'epic_id': epic_id
                }
                result = cursor.execute(update_sql, update_values)
                self.commit(cursor)

        return epic_id, change_type
