from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_model import DeliveryMetricsModel

class DeliveryMetricsSprintModel(DeliveryMetricsModel):

	def syncSprint(self, sprint: dict) -> (int, DeliveryMetricsChangeType):

		# validation
		if not isinstance(sprint, dict):
			return None, DeliveryMetricsChangeType.NONE

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get cursor to keep open across transactions
		cursor = self.cursor()

		# insert dimensions
		sprint_id = self._insertDimensions(sprint)
		if sprint_id is not None:
			change_type = DeliveryMetricsChangeType.INSERT

		# if insert failed, select and update
		if sprint_id is None:
			sprint_id, change_type = self._updateDimensions(cursor, sprint)

		# close cursor
		cursor.close()

		return sprint_id, change_type

	
	def _insertDimensions(self, sprint) -> int:

		# get values needed for sql statement
		guid = sprint.get('guid')
		name = sprint.get('name')
		start = self.formatDate(sprint.get('start_date'))
		end = self.formatDate(sprint.get('end_date'))
		duration = sprint.get('duration')
		quad_id = sprint.get('quad_id')

		# insert into dimension table: sprint
		sql = "insert into sprint(guid, name, start_date, end_date, duration, quad_id) values (?, ?, ?, ?, ?, ?) on conflict(guid) do nothing returning id"
		data = (guid, name, start, end, duration, quad_id)
		sprint_id = self.insertWithoutCursor(sql, data)

		return sprint_id


	def _updateDimensions(self, cursor, sprint: dict) -> (int, DeliveryMetricsChangeType):

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get values needed for sql statement
		guid = sprint.get('guid')
		new_name = sprint.get('name')
		new_start = self.formatDate(sprint.get('start_date'))
		new_end = self.formatDate(sprint.get('end_date'))
		new_duration = sprint.get('duration')
		new_quad_id = sprint.get('quad_id')
		new_values = (new_name, new_start, new_end, new_duration, new_quad_id)

		# select
		select_sql = "select id, name, start_date, end_date, duration, quad_id from sprint where guid = ?"
		select_data = (guid,)
		cursor.execute(select_sql, select_data)
		sprint_id, old_name, old_start, old_end, old_duration, old_quad_id = cursor.fetchone()
		old_values = (old_name, old_start, old_end, old_duration, old_quad_id)

		# compare
		if sprint_id is not None:
			if (new_values != old_values):
				change_type = DeliveryMetricsChangeType.UPDATE
				update_sql = "update sprint set name = ?, start_date = ?, end_date = ?, duration = ?, quad_id = ?, t_modified = current_timestamp where id = ?"
				update_data = new_values + (sprint_id,)
				cursor.execute(update_sql, update_data)

		return sprint_id, change_type

