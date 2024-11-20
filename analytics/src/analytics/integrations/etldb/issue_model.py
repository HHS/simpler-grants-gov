"""Define EtlIssueModel class to encapsulate db CRUD operations."""

from datetime import datetime

from pandas import Series
from psycopg.errors import InsufficientPrivilege
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

from analytics.datasets.etl_dataset import EtlEntityType
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb


class EtlIssueModel:
    """Encapsulate CRUD operations for issue entity."""

    def __init__(self, dbh: EtlDb) -> None:
        """Instantiate a class instance."""
        self.dbh = dbh

    def sync_issue(
        self,
        issue_df: Series,
        ghid_map: dict,
    ) -> tuple[int | None, EtlChangeType]:
        """Write issue data to etl database."""
        # initialize return value
        issue_id = None
        change_type = EtlChangeType.NONE

        try:
            # insert dimensions
            issue_id = self._insert_dimensions(issue_df, ghid_map)
            if issue_id is not None:
                change_type = EtlChangeType.INSERT

            # if insert failed, select and update
            if issue_id is None:
                issue_id, change_type = self._update_dimensions(issue_df, ghid_map)

            # insert facts
            if issue_id is not None:
                self._insert_facts(issue_id, issue_df, ghid_map)
        except (
            InsufficientPrivilege,
            OperationalError,
            ProgrammingError,
            RuntimeError,
        ) as e:
            message = f"FATAL: Failed to sync issue data: {e}"
            raise RuntimeError(message) from e

        return issue_id, change_type

    def _insert_dimensions(self, issue_df: Series, ghid_map: dict) -> int | None:
        """Write issue dimension data to etl database."""
        # insert into dimension table: issue
        new_row_id = None
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "insert into gh_issue "
                "(ghid, title, type, opened_date, closed_date, parent_issue_ghid, epic_id) "
                "values (:ghid, :title, :type, :opened_date, :closed_date, :parent_ghid, :epic_id) "
                "on conflict(ghid) do nothing returning id",
            ),
            {
                "ghid": issue_df["issue_ghid"],
                "title": issue_df["issue_title"],
                "type": issue_df["issue_type"] or "None",
                "opened_date": issue_df["issue_opened_at"],
                "closed_date": issue_df["issue_closed_at"],
                "parent_ghid": issue_df["issue_parent"],
                "epic_id": ghid_map[EtlEntityType.EPIC].get(issue_df["epic_ghid"]),
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
        issue_id: int,
        issue_df: Series,
        ghid_map: dict,
    ) -> tuple[int | None, int | None]:
        """Write issue fact data to etl database."""
        # get values needed for sql statement
        issue_df = issue_df.fillna(0)
        insert_values = {
            "issue_id": issue_id,
            "status": issue_df["issue_status"],
            "is_closed": int(issue_df["issue_is_closed"]),
            "points": issue_df["issue_points"],
            "sprint_id": ghid_map[EtlEntityType.SPRINT].get(issue_df["sprint_ghid"]),
            "effective": self.dbh.effective_date,
        }
        history_id = None
        map_id = None

        # insert into fact table: issue_history
        cursor = self.dbh.connection()
        insert_sql1 = text(
            "insert into gh_issue_history (issue_id, status, is_closed, points, d_effective) "
            "values (:issue_id, :status, :is_closed, :points, :effective) "
            "on conflict (issue_id, d_effective) "
            "do update set (status, is_closed, points, t_modified) = "
            "(:status, :is_closed, :points, current_timestamp) "
            "returning id",
        )
        result1 = cursor.execute(insert_sql1, insert_values)
        row1 = result1.fetchone()
        if row1:
            history_id = row1[0]

        # insert into fact table: issue_sprint_map
        insert_sql2 = text(
            "insert into gh_issue_sprint_map (issue_id, sprint_id, d_effective) "
            "values (:issue_id, :sprint_id, :effective) "
            "on conflict (issue_id, d_effective) "
            "do update set (sprint_id, t_modified) = "
            "(:sprint_id, current_timestamp) returning id",
        )
        result2 = cursor.execute(insert_sql2, insert_values)
        row2 = result2.fetchone()
        if row2:
            map_id = row2[0]

        # commit
        self.dbh.commit(cursor)

        return history_id, map_id

    def _update_dimensions(
        self,
        issue_df: Series,
        ghid_map: dict,
    ) -> tuple[int | None, EtlChangeType]:
        """Update issue dimension data in etl database."""
        # initialize return value
        change_type = EtlChangeType.NONE

        # get new values
        new_values = (
            issue_df["issue_title"],
            issue_df["issue_type"] or "None",
            issue_df["issue_opened_at"],
            issue_df["issue_closed_at"],
            issue_df["issue_parent"],
            ghid_map[EtlEntityType.EPIC].get(issue_df["epic_ghid"]),
        )

        # select old values
        issue_id, o_title, o_type, o_opened, o_closed, o_parent, o_epic_id = (
            self._select(issue_df["issue_ghid"])
        )
        old_values = (o_title, o_type, o_opened, o_closed, o_parent, o_epic_id)

        # compare
        if issue_id is not None and new_values != old_values:
            change_type = EtlChangeType.UPDATE
            cursor = self.dbh.connection()
            cursor.execute(
                text(
                    "update gh_issue set "
                    "title = :new_title, type = :new_type, opened_date = :new_opened, "
                    "closed_date = :new_closed, parent_issue_ghid = :new_parent, "
                    "epic_id = :new_epic_id, t_modified = current_timestamp "
                    "where id = :issue_id",
                ),
                {
                    "new_title": issue_df["issue_title"],
                    "new_type": issue_df["issue_type"] or "None",
                    "new_opened": issue_df["issue_opened_at"],
                    "new_closed": issue_df["issue_closed_at"],
                    "new_parent": issue_df["issue_parent"],
                    "new_epic_id": ghid_map[EtlEntityType.EPIC].get(
                        issue_df["epic_ghid"],
                    ),
                    "issue_id": issue_id,
                },
            )
            self.dbh.commit(cursor)

        return issue_id, change_type

    def _select(self, ghid: str) -> tuple[
        int | None,
        str | None,
        str | None,
        datetime | None,
        datetime | None,
        str | None,
        int | None,
    ]:
        """Select issue data from etl database."""
        cursor = self.dbh.connection()
        result = cursor.execute(
            text(
                "select id, title, type, opened_date, closed_date, parent_issue_ghid, epic_id "
                "from gh_issue where ghid = :ghid",
            ),
            {"ghid": ghid},
        )
        row = result.fetchone()
        if row:
            return row[0], row[1], row[2], row[3], row[4], row[5], row[6]

        return None, None, None, None, None, None, None
