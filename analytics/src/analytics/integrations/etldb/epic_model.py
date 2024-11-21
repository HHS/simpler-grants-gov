"""Defines EtlEpicModel class to encapsulate db CRUD operations."""

from pandas import Series
from psycopg.errors import InsufficientPrivilege
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

from analytics.datasets.etl_dataset import EtlEntityType
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb


class EtlEpicModel:
    """Encapsulate CRUD operations for epic entity."""

    def __init__(self, dbh: EtlDb) -> None:
        """Instantiate a class instance."""
        self.dbh = dbh

    def sync_epic(
        self,
        epic_df: Series,
        ghid_map: dict,
    ) -> tuple[int | None, EtlChangeType]:
        """Write epic data to etl database."""
        # initialize return value
        epic_id = None
        change_type = EtlChangeType.NONE

        try:
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
        except (
            InsufficientPrivilege,
            OperationalError,
            ProgrammingError,
            RuntimeError,
        ) as e:
            message = f"FATAL: Failed to sync epic data: {e}"
            raise RuntimeError(message) from e

        return epic_id, change_type

    def _insert_dimensions(self, epic_df: Series) -> int | None:
        """Write epic dimension data to etl database."""
        # insert into dimension table: epic
        new_row_id = None
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "insert into gh_epic(ghid, title) values (:ghid, :title) "
                "on conflict(ghid) do nothing returning id",
            ),
            {
                "ghid": epic_df["epic_ghid"],
                "title": epic_df["epic_title"],
            },
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.dbh.commit(cursor)

        return new_row_id

    def _insert_facts(
        self,
        epic_id: int,
        epic_df: Series,
        ghid_map: dict,
    ) -> int | None:
        """Write epic fact data to etl database."""
        # insert into fact table: epic_deliverable_map
        new_row_id = None
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "insert into gh_epic_deliverable_map(epic_id, deliverable_id, d_effective) "
                "values (:epic_id, :deliverable_id, :effective) "
                "on conflict(epic_id, d_effective) do update "
                "set (deliverable_id, t_modified) = (:deliverable_id, current_timestamp) "
                "returning id",
            ),
            {
                "deliverable_id": ghid_map[EtlEntityType.DELIVERABLE].get(
                    epic_df["deliverable_ghid"],
                ),
                "epic_id": epic_id,
                "effective": self.dbh.effective_date,
            },
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.dbh.commit(cursor)

        return new_row_id

    def _update_dimensions(self, epic_df: Series) -> tuple[int | None, EtlChangeType]:
        """Update epic dimension data in etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # get new values
        new_title = epic_df["epic_title"]

        # select old values
        epic_id, old_title = self._select(epic_df["epic_ghid"])

        # compare
        if epic_id is not None and (new_title,) != (old_title,):
            change_type = EtlChangeType.UPDATE
            cursor = self.dbh.connection()
            cursor.execute(
                text(
                    "update gh_epic set title = :new_title, t_modified = current_timestamp "
                    "where id = :epic_id",
                ),
                {"new_title": new_title, "epic_id": epic_id},
            )
            self.dbh.commit(cursor)

        return epic_id, change_type

    def _select(self, ghid: str) -> tuple[int | None, str | None]:
        """Select epic data from etl database."""
        cursor = self.dbh.connection()
        result = cursor.execute(
            text("select id, title from gh_epic where ghid = :ghid"),
            {"ghid": ghid},
        )
        row = result.fetchone()
        if row:
            return row[0], row[1]

        return None, None
