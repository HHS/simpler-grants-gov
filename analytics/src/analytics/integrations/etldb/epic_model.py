from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlEpicModel(EtlDb):

    def syncEpic(self, epic: dict) -> (int, EtlChangeType):

        # validation
        if not isinstance(epic, dict):
            return None, EtlChangeType.NONE

        # initialize return value
        change_type = EtlChangeType.NONE

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        epic_id = self._insertDimensions(cursor, epic)
        if epic_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if epic_id is None:
            epic_id, change_type = self._updateDimensions(cursor, epic)

        # insert facts
        if epic_id is not None:
            fact_id = self._insertFacts(cursor, epic_id, epic)

        # commit
        self.commit(cursor)

        return epic_id, change_type


    def _insertDimensions(self, cursor, epic: dict) -> int:

        # get values needed for sql statement
        ghid = epic.get('ghid')
        title = epic.get('title')
        deliverable_id = epic.get('deliverable_id')
        effective = self.getEffectiveDate()

        # insert into dimension table: epic
        insert_sql = f"insert into epic(ghid, title) values ({ghid}, {title}) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql),)
        epic_id = result.inserted_primary_key[0]

        return epic_id
    

    def _insertFacts(self, cursor, epic_id: int, epic: dict) -> int:

        # get values needed for sql statement
        deliverable_id = epic.get('deliverable_id')
        effective = self.getEffectiveDate()

        # insert into fact table: epic_deliverable_map
        insert_sql = f"insert into epic_deliverable_map(epic_id, deliverable_id, d_effective) values ({epic_id}, {deliverable_id}, {effective}) on conflict(epic_id, d_effective) do update set (deliverable_id, t_modified) = ({deliverable_id}, current_timestamp) returning id"
        result = cursor.execute(text(insert_sql),)
        map_id = result.inserted_primary_key[0]

        return map_id 


    def _updateDimensions(self, cursor, epic: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = epic.get('ghid')
        new_title = epic.get('title')

        # select
        select_sql = "select id, title from epic where ghid = {ghid}"
        result = cursor.execute(text(select_sql),)
        epic_id, old_title = result.fetchone()

        # compare
        if epic_id is not None:
            if ((new_title, ) != (old_title, )):
                change_type = EtlChangeType.UPDATE
                update_sql = "update epic set title = {new_title}, t_modified = current_timestamp where id = {epic_id}"
                result = cursor.execute(update_sql)

        return epic_id, change_type

