from analytics.integrations.etldb.etldb import EtlChangeType, EtlDb

class EtlQuadModel(EtlDb):

    def syncQuad(self, quad: dict) -> (int, EtlChangeType):
    
        # validation
        if not isinstance(quad, dict):
            return None, EtlChangeType.NONE

        # initialize return value
        change_type = EtlChangeType.NONE 

        # get cursor to keep open across transactions
        cursor = self.connection()

        # insert dimensions
        quad_id = self._insertDimensions(quad)
        if quad_id is not None:
            change_type = EtlChangeType.INSERT 
            
        # if insert failed, then select and update
        if quad_id is None:
            quad_id, change_type = self._updateDimensions(cursor, quad)

        # commit
        self.commit(cursor)

        return quad_id, change_type


    def _insertDimensions(self, quad: dict) -> int:

        # get values needed for sql statement
        ghid = quad.get('ghid')
        name = quad.get('name')
        start_date = self.formatDate(quad.get('start_date'))
        end_date = self.formatDate(quad.get('end_date'))
        duration = quad.get('duration')

        # insert into dimension table: quad
        sql = f"insert into quad(ghid, name, start_date, end_date, duration) values ({ghid}, {name}, {start_date}, {end_date}, {duration}) on conflict(ghid) do nothing returning id"
        result = cursor.execute(text(insert_sql),)
        quad_id = result.inserted_primary_key[0]

        return quad_id


    def _updateDimensions(self, cursor, quad: dict) -> (int, EtlChangeType):

        # initialize return value
        change_type = EtlChangeType.NONE

        # get values needed for sql statement
        ghid = quad.get('ghid')
        new_name = quad.get('name')
        new_start = self.formatDate(quad.get('start_date'))
        new_end = self.formatDate(quad.get('end_date'))
        new_duration = quad.get('duration')
        new_values = (new_name, new_start, new_end, new_duration)

        # select
        select_sql = "select id, name, start_date, end_date, duration from quad where ghid = ghid"
        result = cursor.execute(text(select_sql),)
        quad_id, old_name, old_start, old_end, old_duration = result.fetchone()
        old_values = (old_name, old_start, old_end, old_duration)

        # compare
        if quad_id is not None:
            if (new_values != old_values):
                change_type = EtlChangeType.UPDATE
                update_sql = "update quad set name = {new_name}, start_date = {new_start}, end_date = {new_end}, duration = {new_duration}, t_modified = current_timestamp where id = {quad_id}"
                result = cursor.execute(update_sql)

        return quad_id, change_type

