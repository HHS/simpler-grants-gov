from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_model import DeliveryMetricsModel

class DeliveryMetricsDeliverableModel(DeliveryMetricsModel):

	def syncDeliverable(self, deliverable: dict) -> (int, DeliveryMetricsChangeType):
		
		# validation
		if not isinstance(deliverable, dict):
			return None, DeliveryMetricsChangeType.NONE

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get cursor to keep open across transactions
		cursor = self.cursor()

		# insert dimensions
		deliverable_id = self._insertDimensions(cursor, deliverable)
		if deliverable_id is not None:
			change_type = DeliveryMetricsChangeType.INSERT

		# if insert failed, select and update
		if deliverable_id is None:
			deliverable_id, change_type = self._updateDimensions(cursor, deliverable)

		# insert facts 
		if deliverable_id is not None:
			map_id = self._insertFacts(cursor, deliverable_id, deliverable)

		# close cursor
		cursor.close()

		return deliverable_id, change_type


	def _insertDimensions(self, cursor, deliverable: dict) -> int:

		# get values needed for sql statement
		guid = deliverable.get('guid')
		title = deliverable.get('title')
		pillar = deliverable.get('pillar')

		# insert into dimension table: deliverable
		insert_sql = "insert into deliverable(guid, title, pillar) values (?, ?, ?) on conflict(guid) do nothing returning id"
		insert_data = (guid, title, pillar)
		deliverable_id = self.insertWithCursor(cursor, insert_sql, insert_data)

		return deliverable_id


	def _insertFacts(self, cursor, deliverable_id: int, deliverable: dict) -> int:

		# get values needed for sql statement
		quad_id = deliverable.get('quad_id')
		effective = self.getEffectiveDate()

		# insert into fact table: deliverable_quad_map
		insert_sql = "insert into deliverable_quad_map(deliverable_id, quad_id, d_effective) values (?, ?, ?) on conflict(deliverable_id, d_effective) do update set (quad_id, t_modified) = (?, current_timestamp) returning id"
		insert_data = (deliverable_id, quad_id, effective, quad_id)
		map_id = self.insertWithCursor(cursor, insert_sql, insert_data)

		return map_id


	def _updateDimensions(self, cursor, deliverable: dict) -> (int, DeliveryMetricsChangeType):

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get values needed for sql statement
		guid = deliverable.get('guid')
		new_title = deliverable.get('title')
		new_pillar = deliverable.get('pillar')
		new_values = (new_title, new_pillar)

		# select
		select_sql = "select id, title, pillar from deliverable where guid = ?"
		select_data = (guid,)
		cursor.execute(select_sql, select_data)
		deliverable_id, old_title, old_pillar = cursor.fetchone()
		old_values = (old_title, old_pillar)

		# compare
		if deliverable_id is not None:
			if (new_values != old_values):
				change_type = DeliveryMetricsChangeType.UPDATE
				sql_update = "update deliverable set title = ?, pillar = ?, t_modified = current_timestamp where id = ?"
				data_update = (new_title, new_pillar, deliverable_id)
				cursor.execute(sql_update, data_update)

		return deliverable_id, change_type

