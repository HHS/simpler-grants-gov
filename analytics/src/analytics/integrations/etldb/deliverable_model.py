from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlDeliverableModel(EtlDb):

    def syncDeliverable(self, deliverable: dict) -> (int, EtlChangeType):
        
        # validation
        if not isinstance(deliverable, dict):
            return None, EtlChangeType.NONE

        # initialize return value
        change_type = EtlChangeType.NONE

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        deliverable_id = self._insertDimensions(cursor, deliverable)
        if deliverable_id is not None:
            change_type = EtlChangeType.INSERT

        # if insert failed, select and update
        if deliverable_id is None:
            deliverable_id, change_type = self._updateDimensions(cursor, deliverable)

        # insert facts 
        if deliverable_id is not None:
            map_id = self._insertFacts(cursor, deliverable_id, deliverable)

        # commit
        self.commit(cursor)

        return deliverable_id, change_type


    def _insertDimensions(self, cursor, deliverable: dict) -> int:

        # get values needed for sql statement
        ghid = deliverable.get('ghid')
        title = deliverable.get('title')
        pillar = deliverable.get('pillar')

        # insert into dimension table: deliverable
        insert_sql = f"insert into deliverable(ghid, title, pillar) values ({ghid}, {title}, {pillar}) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql),)
        deliverable_id = result.inserted_primary_key[0]

        return deliverable_id


    def _insertFacts(self, cursor, deliverable_id: int, deliverable: dict) -> int:

        # get values needed for sql statement
        quad_id = deliverable.get('quad_id')
        effective = self.getEffectiveDate()

        # insert into fact table: deliverable_quad_map
        insert_sql = f"insert into deliverable_quad_map(deliverable_id, quad_id, d_effective) values ({deliverable_id}, {quad_id}, {effective}) on conflict(deliverable_id, d_effective) do update set (quad_id, t_modified) = ({quad_id}, current_timestamp) returning id"
        result = cursor.execute(text(insert_sql),)
        map_id = result.inserted_primary_key[0]

        return map_id


    def _updateDimensions(self, cursor, deliverable: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = deliverable.get('ghid')
        new_title = deliverable.get('title')
        new_pillar = deliverable.get('pillar')
        new_values = (new_title, new_pillar)

        # select
        select_sql = "select id, title, pillar from deliverable where ghid = {ghid}"
        result = cursor.execute(text(select_sql),)
        deliverable_id, old_title, old_pillar = result.fetchone()
        old_values = (old_title, old_pillar)

        # compare
        if deliverable_id is not None:
            if (new_values != old_values):
                change_type = EtlChangeType.UPDATE
                update_sql = "update deliverable set title = {new_title}, pillar = {new_pillar}, t_modified = current_timestamp where id = {deliverable_id}"
                result = cursor.execute(update_sql)

        return deliverable_id, change_type

