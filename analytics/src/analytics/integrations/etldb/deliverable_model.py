from sqlalchemy import text

from pandas import DataFrame

from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlDeliverableModel(EtlDb):

    def sync_deliverable(self, deliverable_df: DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # insert dimensions
        deliverable_id = self._insert_dimensions(deliverable_df)
        if deliverable_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if deliverable_id is None:
            deliverable_id, change_type = self._update_dimensions(deliverable_df)

        # insert facts
        if deliverable_id is not None:
            self._insert_facts(deliverable_id, deliverable_df, ghid_map)

        return deliverable_id, change_type


    def _insert_dimensions(self, deliverable_df: DataFrame) -> int:

        # get values needed for sql statement
        insert_values = {
            'ghid': deliverable_df['deliverable_ghid'],
            'title': deliverable_df['deliverable_title'],
            'pillar': deliverable_df['deliverable_pillar'],
        }
        new_row_id = None

        # insert into dimension table: deliverable
        cursor = self.connection()
        insert_sql = text(
            "insert into gh_deliverable(ghid, title, pillar) "
            "values (:ghid, :title, :pillar) "
            "on conflict(ghid) do nothing returning id"
        )
        result = cursor.execute(insert_sql, insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _insert_facts(self, deliverable_id: int, deliverable_df: DataFrame, ghid_map: dict) -> int:

        # get values needed for sql statement
        insert_values = {
            'deliverable_id': deliverable_id,
            'quad_id': ghid_map[entity.QUAD].get(deliverable_df['quad_ghid']),
            'effective': self.effective_date,
        }
        new_row_id = None

        # insert into fact table: deliverable_quad_map
        cursor = self.connection()
        insert_sql = text(
            "insert into gh_deliverable_quad_map(deliverable_id, quad_id, d_effective) "
            "values (:deliverable_id, :quad_id, :effective) "
            "on conflict(deliverable_id, d_effective) do update "
            "set (quad_id, t_modified) = (:quad_id, current_timestamp) returning id"
        )
        result = cursor.execute(insert_sql, insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _update_dimensions(self, deliverable_df: DataFrame) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = deliverable_df['deliverable_ghid']
        new_title = deliverable_df['deliverable_title']
        new_pillar = deliverable_df['deliverable_pillar']
        new_values = (new_title, new_pillar)

        # select
        cursor = self.connection()
        select_sql = "select id, title, pillar from gh_deliverable where ghid = :ghid"
        select_values = { 'ghid': ghid }
        result = cursor.execute(text(select_sql), select_values)
        deliverable_id, old_title, old_pillar = result.fetchone()
        old_values = (old_title, old_pillar)

        # compare
        if deliverable_id is not None:
            if new_values != old_values:
                change_type = EtlChangeType.UPDATE
                update_sql = text(
                    "update gh_deliverable set title = :new_title, pillar = :new_pillar, "
                    "t_modified = current_timestamp where id = :deliverable_id"
                )
                update_values = {
                    'new_title': new_title,
                    'new_pillar': new_pillar,
                    'deliverable_id': deliverable_id,
                }
                result = cursor.execute(update_sql, update_values)
                self.commit(cursor)

        return deliverable_id, change_type
