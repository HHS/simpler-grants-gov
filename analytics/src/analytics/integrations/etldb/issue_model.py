from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlIssueModel(EtlDb):

    def syncIssue(self, issue: dict) -> (int, EtlChangeType):

        # validation
        if not isinstance(issue, dict):
            return None, EtlChangeType.NONE

        # initialize return value
        change_type = EtlChangeType.NONE

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        issue_id = self._insertDimensions(cursor, issue)
        if issue_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if issue_id is None:
            issue_id, change_type = self._updateDimensions(cursor, issue)

        # insert facts
        if issue_id is not None:
            history_id, map_id = self._insertFacts(cursor, issue_id, issue)

        # commit
        self.commit(cursor)
        
        return issue_id, change_type


    def _insertDimensions(self, cursor, issue: dict) -> int:

        # get values needed for sql statement
        ghid = issue.get('ghid')
        title = issue.get('title')
        t = issue.get('type')
        opened_date = self.formatDate(issue.get('opened_date'))
        closed_date = self.formatDate(issue.get('closed_date'))
        parent_ghid = issue.get('parent_ghid')
        epic_id = issue.get('epic_id')

        # insert into dimension table: issue
        insert_sql = f"insert into issue (ghid, title, type, opened_date, closed_date, parent_issue_ghid, epic_id) values ({ghid}, {title}, {t}, {opened_date}, {closed_date}, {parent_ghid}, {epic_id}) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql),)
        issue_id = result.inserted_primary_key[0]

        return issue_id


    def _insertFacts(self, cursor, issue_id: int, issue: dict) -> (int, int):

        # get values needed for sql statement
        status = issue.get('status')
        is_closed = issue.get('is_closed')
        points = issue.get('points') or 0
        sprint_id = issue.get('sprint_id')
        effective = self.getEffectiveDate()

        # insert into fact table: issue_history
        insert_sql1 = f"insert into issue_history (issue_id, status, is_closed, points, d_effective) values ({issue_id}, {status}, {is_closed}, {points}, {effective}) on conflict (issue_id, d_effective) do update set (status, is_closed, points, t_modified) = ({status}, {is_closed}, {points}, current_timestamp) returning id" 
        result1 = cursor.execute(text(insert_sql1),)
        history_id = result1.inserted_primary_key[0]

        # insert into fact table: issue_sprint_map
        insert_sql2 = f"insert into issue_sprint_map (issue_id, sprint_id, d_effective) values ({issue_id}, {sprint_id}, {effective}) on conflict (issue_id, d_effective) do update set (sprint_id, t_modified) = ({sprint_id}, current_timestamp) returning id"
        result2 = cursor.execute(text(insert_sql2),)
        map_id = result2.inserted_primary_key[0]

        return history_id, map_id


    def _updateDimensions(self, cursor, issue: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = issue.get('ghid')
        new_title = issue.get('title')
        new_type = issue.get('type')
        new_opened = self.formatDate(issue.get('opened_date'))
        new_closed = self.formatDate(issue.get('closed_date'))
        new_parent = issue.get('parent_ghid')
        new_epic_id = issue.get('epic_id')
        new_values = (new_title, new_type, new_opened, new_closed, new_parent, new_epic_id)

        # select
        select_sql = "select id, title, type, opened_date, closed_date, parent_issue_ghid, epic_id from issue where ghid = {ghid}"
        result = cursor.execute(text(select_sql),)
        issue_id, old_title, old_type, old_opened, old_closed, old_parent, old_epic_id = result.fetchone()
        old_values = (old_title, old_type, old_opened, old_closed, old_parent, old_epic_id)

        # compare
        if issue_id is not None:
            if (new_values != old_values):
                change_type = EtlChangeType.UPDATE
                update_sql = "update issue set title = {new_title}, type = {new_type}, opened_date = {new_opened}, closed_date = {new_closed}, parent_issue_ghid = {new_parent}, epic_id = {new_epic_id}, t_modified = current_timestamp where id = {issue_id}"
                result = cursor.execute(update_sql)

        return issue_id, change_type

