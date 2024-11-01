"""Define EtlDeliverableModel class to encapsulate db CRUD operations"""

from typing import Tuple
from sqlalchemy import text
from pandas import Series
from analytics.datasets.etl_dataset import EtlEntityType
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb


class EtlDeliverableModel(EtlDb):
    """Encapsulate CRUD operations for deliverable entity"""

    def sync_deliverable(
        self, deliverable_df: Series, ghid_map: dict
    ) -> Tuple[int | None, EtlChangeType]:
        """Write deliverable data to etl database"""

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

    def _insert_dimensions(self, deliverable_df: Series) -> int | None:
        """Write deliverable dimension data to etl database"""

        # insert into dimension table: deliverable
        new_row_id = None
        cursor = self.connection()
        result = cursor.execute(
            text(
                "insert into gh_deliverable(ghid, title, pillar) "
                "values (:ghid, :title, :pillar) "
                "on conflict(ghid) do nothing returning id"
            ),
            {
                "ghid": deliverable_df["deliverable_ghid"],
                "title": deliverable_df["deliverable_title"],
                "pillar": deliverable_df["deliverable_pillar"],
            },
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id

    def _insert_facts(
        self, deliverable_id: int, deliverable_df: Series, ghid_map: dict
    ) -> int | None:
        """Write deliverable fact data to etl database"""

        # insert into fact table: deliverable_quad_map
        new_row_id = None
        cursor = self.connection()
        result = cursor.execute(
            text(
                "insert into gh_deliverable_quad_map(deliverable_id, quad_id, d_effective) "
                "values (:deliverable_id, :quad_id, :effective) "
                "on conflict(deliverable_id, d_effective) do update "
                "set (quad_id, t_modified) = (:quad_id, current_timestamp) returning id"
            ),
            {
                "deliverable_id": deliverable_id,
                "quad_id": ghid_map[EtlEntityType.QUAD].get(
                    deliverable_df["quad_ghid"]
                ),
                "effective": self.effective_date,
            },
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id

    def _update_dimensions(
        self, deliverable_df: Series
    ) -> Tuple[int | None, EtlChangeType]:
        """Update deliverable fact data in etl database"""

        # initialize return value
        change_type = EtlChangeType.NONE

        # get new values
        new_title = deliverable_df["deliverable_title"]
        new_pillar = deliverable_df["deliverable_pillar"]
        new_values = (new_title, new_pillar)

        # select old values
        deliverable_id, old_title, old_pillar = self._select(
            deliverable_df["deliverable_ghid"]
        )
        old_values = (old_title, old_pillar)

        # compare
        if deliverable_id is not None and new_values != old_values:
            change_type = EtlChangeType.UPDATE
            cursor = self.connection()
            update_sql = text(
                "update gh_deliverable set title = :new_title, pillar = :new_pillar, "
                "t_modified = current_timestamp where id = :deliverable_id"
            )
            update_values = {
                "new_title": new_title,
                "new_pillar": new_pillar,
                "deliverable_id": deliverable_id,
            }
            cursor.execute(update_sql, update_values)
            self.commit(cursor)

        return deliverable_id, change_type

    def _select(self, ghid: str) -> Tuple[int | None, str | None, str | None]:
        """Select deliverable data from etl database"""

        cursor = self.connection()
        result = cursor.execute(
            text("select id, title, pillar from gh_deliverable where ghid = :ghid"),
            {"ghid": ghid},
        )
        row = result.fetchone()
        if row:
            return row[0], row[1], row[2]

        return None, None, None
