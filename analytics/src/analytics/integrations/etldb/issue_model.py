from sqlalchemy import text

import pandas

from analytics.datasets.etl_dataset import EtlEntityType as entity
from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlIssueModel(EtlDb):

    def syncIssue(self, issue_df: pandas.DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        issue_id = self._insertDimensions(cursor, issue_df, ghid_map)
        if issue_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if issue_id is None:
            issue_id, change_type = self._updateDimensions(cursor, issue_df, ghid_map)

        # insert facts
        if issue_id is not None:
            history_id, map_id = self._insertFacts(cursor, issue_id, issue_df, ghid_map)

        # commit
        #self.commit(cursor)
        
        return issue_id, change_type


    def _insertDimensions(self, cursor, issue_df: pandas.DataFrame, ghid_map: dict) -> int:

        # get values needed for sql statement
        insert_values = {
            'ghid': issue_df['issue_ghid'],
            'title': issue_df['issue_title'],
            'type': issue_df['issue_type'] or 'None',
            'opened_date': issue_df['issue_opened_at'],
            'closed_date': issue_df['issue_closed_at'],
            'parent_ghid': issue_df['issue_parent'],
            'epic_id': ghid_map[entity.EPIC].get(issue_df['epic_ghid'])
        }
        new_row_id = None

        # insert into dimension table: issue
        insert_sql = "insert into gh_issue (ghid, title, type, opened_date, closed_date, parent_issue_ghid, epic_id) values (:ghid, :title, :type, :opened_date, :closed_date, :parent_ghid, :epic_id) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql), insert_values)
        row = result.fetchone()
        if row:
            new_row_id = row[0]

        # commit
        self.commit(cursor)

        return new_row_id


    def _insertFacts(self, cursor, issue_id: int, issue_df: pandas.DataFrame, ghid_map: dict) -> (int, int):

        # get values needed for sql statement
        issue_df.fillna(0, inplace=True)
        insert_values = {
            'issue_id': issue_id,
            'status': issue_df['issue_status'],
            'is_closed': int(issue_df['issue_is_closed']),
            'points': issue_df['issue_points'],
            'sprint_id': ghid_map[entity.SPRINT].get(issue_df['sprint_ghid']),
        }
        history_id = None
        map_id = None

        # insert into fact table: issue_history
        insert_sql1 = f"insert into gh_issue_history (issue_id, status, is_closed, points, d_effective) values (:issue_id, :status, :is_closed, :points, '{self.effective_date}') on conflict (issue_id, d_effective) do update set (status, is_closed, points, t_modified) = (:status, :is_closed, :points, current_timestamp) returning id" 
        result1 = cursor.execute(text(insert_sql1), insert_values)
        row1 = result1.fetchone()
        if row1:
            history_id = row1[0]

        # insert into fact table: issue_sprint_map
        insert_sql2 = f"insert into gh_issue_sprint_map (issue_id, sprint_id, d_effective) values (:issue_id, :sprint_id, '{self.effective_date}') on conflict (issue_id, d_effective) do update set (sprint_id, t_modified) = (:sprint_id, current_timestamp) returning id"
        result2 = cursor.execute(text(insert_sql2), insert_values)
        row2 = result2.fetchone()
        if row2:
            map_id = row2[0]

        # commit
        self.commit(cursor)

        return history_id, map_id


    def _updateDimensions(self, cursor, issue_df: pandas.DataFrame, ghid_map: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = issue_df['issue_ghid']
        new_title = issue_df['issue_title']
        new_type = issue_df['issue_type'] or 'None'
        new_opened = issue_df['issue_opened_at']
        new_closed = issue_df['issue_closed_at']
        new_parent = issue_df['issue_parent']
        new_epic_id = ghid_map[entity.EPIC].get(issue_df['epic_ghid'])
        new_values = (new_title, new_type, new_opened, new_closed, new_parent, new_epic_id)

        # select
        select_sql = f"select id, title, type, opened_date, closed_date, parent_issue_ghid, epic_id from gh_issue where ghid = '{ghid}'"
        result = cursor.execute(text(select_sql),)
        issue_id, old_title, old_type, old_opened, old_closed, old_parent, old_epic_id = result.fetchone()
        old_values = (old_title, old_type, old_opened, old_closed, old_parent, old_epic_id)

        # compare
        if issue_id is not None:
            if (new_values != old_values):
                change_type = EtlChangeType.UPDATE
                update_sql = f"update gh_issue set title = :new_title, type = :new_type, opened_date = :new_opened, closed_date = :new_closed, parent_issue_ghid = :new_parent, epic_id = :new_epic_id, t_modified = current_timestamp where id = {issue_id}"
                update_values = {
                    'new_title': new_title,
                    'new_type': new_type,
                    'new_opened': new_opened,
                    'new_closed': new_closed,
                    'new_parent': new_parent,
                    'new_epic_id': new_epic_id,
                }
                result = cursor.execute(text(update_sql), update_values)
                self.commit(cursor)

        return issue_id, change_type

