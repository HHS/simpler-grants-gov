from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlSprintModel(EtlDb):

    def syncSprint(self, sprint: dict) -> (int, EtlChangeType):

        # validation
        if not isinstance(sprint, dict):
            return None, EtlChangeType.NONE

        # initialize return value
        change_type = EtlChangeType.NONE

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        sprint_id = self._insertDimensions(sprint)
        if sprint_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if sprint_id is None:
            sprint_id, change_type = self._updateDimensions(cursor, sprint)

        # commit
        self.commit(cursor)

        return sprint_id, change_type

    
    def _insertDimensions(self, sprint) -> int:

        # get values needed for sql statement
        ghid = sprint.get('ghid')
        name = sprint.get('name')
        start = self.formatDate(sprint.get('start_date'))
        end = self.formatDate(sprint.get('end_date'))
        duration = sprint.get('duration')
        quad_id = sprint.get('quad_id')

        # insert into dimension table: sprint
        sql = f"insert into sprint(ghid, name, start_date, end_date, duration, quad_id) values ({ghid}, {name}, {start}, {end}, {duration}, {quad_id}) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql),)
        sprint_id = result.inserted_primary_key[0]

        return sprint_id


    def _updateDimensions(self, cursor, sprint: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = sprint.get('ghid')
        new_name = sprint.get('name')
        new_start = self.formatDate(sprint.get('start_date'))
        new_end = self.formatDate(sprint.get('end_date'))
        new_duration = sprint.get('duration')
        new_quad_id = sprint.get('quad_id')
        new_values = (new_name, new_start, new_end, new_duration, new_quad_id)

        # select
        select_sql = "select id, name, start_date, end_date, duration, quad_id from sprint where ghid = {ghid}"
        result = cursor.execute(text(select_sql),)
        sprint_id, old_name, old_start, old_end, old_duration, old_quad_id = result.fetchone()
        old_values = (old_name, old_start, old_end, old_duration, old_quad_id)

        # compare
        if sprint_id is not None:
            if (new_values != old_values):
                change_type = EtlChangeType.UPDATE
                update_sql = "update sprint set name = {new_name}, start_date = {new_start}, end_date = {new_end}, duration = {new_duration}, quad_id = {new_quad_id}, t_modified = current_timestamp where id = {sprint_id}"
                result = cursor.execute(update_sql)

        return sprint_id, change_type

