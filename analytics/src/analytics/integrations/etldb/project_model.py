"""Defines EtlProjectModel class to encapsulate db CRUD operations."""

from pandas import Series
from sqlalchemy import text

from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb


class EtlProjectModel:
    """Encapsulates CRUD operations for project entity."""

    def __init__(self, dbh: EtlDb) -> None:
        """Instantiate a class instance."""
        self.dbh = dbh

    def sync_project(self, project_df: Series) -> tuple[int | None, EtlChangeType]:
        """Write project data to etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # insert dimensions
        project_id = self._insert_dimensions(project_df)
        if project_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, then select and update
        if project_id is None:
            project_id, change_type = self._update_dimensions(project_df)

        return project_id, change_type

    def _insert_dimensions(self, project_df: Series) -> int | None:
        """Write project dimension data to etl database."""
        # insert into dimension table: project
        new_row_id = None
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "insert into gh_project(ghid, name) values (:ghid, :name) "
                "on conflict(ghid) do nothing returning id",
            ),
            {"ghid": project_df["project_ghid"], "name": project_df["project_name"]},
        )
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.dbh.commit(cursor)

        return new_row_id

    def _update_dimensions(
        self,
        project_df: Series,
    ) -> tuple[int | None, EtlChangeType]:
        """Update project dimension data in etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # get new values
        new_name = project_df["project_name"]

        # select old values
        project_id, old_name = self._select(
            project_df["project_ghid"],
        )

        # compare
        if project_id is not None and new_name != old_name:
            change_type = EtlChangeType.UPDATE
            cursor = self.dbh.connection()
            cursor.execute(
                text(
                    "update gh_project set name = :new_name, "
                    "t_modified = current_timestamp where id = :project_id",
                ),
                {
                    "new_name": new_name,
                    "project_id": project_id,
                },
            )
            self.dbh.commit(cursor)

        return project_id, change_type

    def _select(self, ghid: str) -> tuple[
        int | None,
        str | None,
    ]:
        """Select epic data from etl database."""
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "select id, name from gh_project where ghid = :ghid",
            ),
            {"ghid": ghid},
        )
        row = result.fetchone()
        if row:
            return row[0], row[1]

        return None, None
