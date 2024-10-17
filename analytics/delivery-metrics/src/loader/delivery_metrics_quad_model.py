from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_model import DeliveryMetricsModel

class DeliveryMetricsQuadModel(DeliveryMetricsModel):

	def syncQuad(self, quad: dict) -> (int, DeliveryMetricsChangeType):
	
		# validation
		if not isinstance(quad, dict):
			return None, DeliveryMetricsChangeType.NONE

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE 

		# get cursor to keep open across transactions
		cursor = self.cursor()

		# insert dimensions
		quad_id = self._insertDimensions(quad)
		if quad_id is not None:
			change_type = DeliveryMetricsChangeType.INSERT 
			
		# if insert failed, then select and update
		if quad_id is None:
			quad_id, change_type = self._updateDimensions(cursor, quad)

		# close cursor
		cursor.close()

		return quad_id, change_type


	def _insertDimensions(self, quad: dict) -> int:

		# get values needed for sql statement
		guid = quad.get('guid')
		name = quad.get('name')
		start_date = self.formatDate(quad.get('start_date'))
		end_date = self.formatDate(quad.get('end_date'))
		duration = quad.get('duration')

		# insert into dimension table: quad
		sql = "insert into quad(guid, name, start_date, end_date, duration) values (?, ?, ?, ?, ?) on conflict(guid) do nothing returning id"
		data = (guid, name, start_date, end_date, duration)
		quad_id = self.insertWithoutCursor(sql, data)

		return quad_id


	def _updateDimensions(self, cursor, quad: dict) -> (int, DeliveryMetricsChangeType):

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get values needed for sql statement
		guid = quad.get('guid')
		new_name = quad.get('name')
		new_start = self.formatDate(quad.get('start_date'))
		new_end = self.formatDate(quad.get('end_date'))
		new_duration = quad.get('duration')
		new_values = (new_name, new_start, new_end, new_duration)

		# select
		select_sql = "select id, name, start_date, end_date, duration from quad where guid = ?"
		select_data = (guid,)
		cursor.execute(select_sql, select_data)
		quad_id, old_name, old_start, old_end, old_duration = cursor.fetchone()
		old_values = (old_name, old_start, old_end, old_duration)

		# compare
		if quad_id is not None:
			if (new_values != old_values):
				change_type = DeliveryMetricsChangeType.UPDATE
				update_sql = "update quad set name = ?, start_date = ?, end_date = ?, duration = ?, t_modified = current_timestamp where id = ?"
				update_data = new_values + (quad_id,)
				cursor.execute(update_sql, update_data)

		return quad_id, change_type

