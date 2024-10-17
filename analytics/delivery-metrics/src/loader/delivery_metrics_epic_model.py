from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_model import DeliveryMetricsModel

class DeliveryMetricsEpicModel(DeliveryMetricsModel):

	def syncEpic(self, epic: dict) -> (int, DeliveryMetricsChangeType):

		# validation
		if not isinstance(epic, dict):
			return None, DeliveryMetricsChangeType.NONE

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get cursor to keep open across transactions
		cursor = self.cursor()

		# insert dimensions
		epic_id = self._insertDimensions(cursor, epic)
		if epic_id is not None:
			change_type = DeliveryMetricsChangeType.INSERT

		# if insert failed, select and update
		if epic_id is None:
			epic_id, change_type = self._updateDimensions(cursor, epic)

		# insert facts
		if epic_id is not None:
			fact_id = self._insertFacts(cursor, epic_id, epic)

		# close cursor
		cursor.close()

		return epic_id, change_type


	def _insertDimensions(self, cursor, epic: dict) -> int:

		# get values needed for sql statement
		guid = epic.get('guid')
		title = epic.get('title')
		deliverable_id = epic.get('deliverable_id')
		effective = self.getEffectiveDate()

		# insert into dimension table: epic
		insert_sql = "insert into epic(guid, title) values (?, ?) on conflict(guid) do nothing returning id"
		insert_data = (guid, title)
		epic_id = self.insertWithCursor(cursor, insert_sql, insert_data)

		return epic_id
	

	def _insertFacts(self, cursor, epic_id: int, epic: dict) -> int:

		# get values needed for sql statement
		deliverable_id = epic.get('deliverable_id')
		effective = self.getEffectiveDate()

		# insert into fact table: epic_deliverable_map
		insert_sql = "insert into epic_deliverable_map(epic_id, deliverable_id, d_effective) values (?, ?, ?) on conflict(epic_id, d_effective) do update set (deliverable_id, t_modified) = (?, current_timestamp) returning id"
		insert_data = (epic_id, deliverable_id, effective, deliverable_id)
		map_id = self.insertWithCursor(cursor, insert_sql, insert_data)

		return map_id 


	def _updateDimensions(self, cursor, epic: dict) -> (int, DeliveryMetricsChangeType):

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get values needed for sql statement
		guid = epic.get('guid')
		new_title = epic.get('title')

		# select
		select_sql = "select id, title from epic where guid = ?"
		select_data = (guid,)
		cursor.execute(select_sql, select_data)
		epic_id, old_title = cursor.fetchone()

		# compare
		if epic_id is not None:
			if ((new_title, ) != (old_title, )):
				change_type = DeliveryMetricsChangeType.UPDATE
				sql_update = "update epic set title = ?, t_modified = current_timestamp where id = ?"
				data_update = (new_title, epic_id)
				cursor.execute(sql_update, data_update)

		return epic_id, change_type

