from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_model import DeliveryMetricsModel

class DeliveryMetricsIssueModel(DeliveryMetricsModel):

	def syncIssue(self, issue: dict) -> (int, DeliveryMetricsChangeType):

		# validation
		if not isinstance(issue, dict):
			return None, DeliveryMetricsChangeType.NONE

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get cursor to keep open across transactions
		cursor = self.cursor()

		# insert dimensions
		issue_id = self._insertDimensions(cursor, issue)
		if issue_id is not None:
			change_type = DeliveryMetricsChangeType.INSERT

		# if insert failed, select and update
		if issue_id is None:
			issue_id, change_type = self._updateDimensions(cursor, issue)

		# insert facts
		if issue_id is not None:
			history_id, map_id = self._insertFacts(cursor, issue_id, issue)

		# close cursor
		cursor.close()
		
		return issue_id, change_type


	def _insertDimensions(self, cursor, issue: dict) -> int:

		# get values needed for sql statement
		guid = issue.get('guid')
		title = issue.get('title')
		t = issue.get('type')
		opened_date = self.formatDate(issue.get('opened_date'))
		closed_date = self.formatDate(issue.get('closed_date'))
		parent_guid = issue.get('parent_guid')
		epic_id = issue.get('epic_id')

		# insert into dimension table: issue
		insert_sql = "insert into issue (guid, title, type, opened_date, closed_date, parent_issue_guid, epic_id) values (?, ?, ?, ?, ?, ?, ?) on conflict(guid) do nothing returning id"
		insert_data = (guid, title, t, opened_date, closed_date, parent_guid, epic_id)
		issue_id = self.insertWithCursor(cursor, insert_sql, insert_data)

		return issue_id


	def _insertFacts(self, cursor, issue_id: int, issue: dict) -> (int, int):

		# get values needed for sql statement
		status = issue.get('status')
		is_closed = issue.get('is_closed')
		points = issue.get('points') or 0
		sprint_id = issue.get('sprint_id')
		effective = self.getEffectiveDate()

		# insert into fact table: issue_history
		insert_sql1 = "insert into issue_history (issue_id, status, is_closed, points, d_effective) values (?, ?, ?, ?, ?) on conflict (issue_id, d_effective) do update set (status, is_closed, points, t_modified) = (?, ?, ?, current_timestamp) returning id" 
		insert_data1 = (issue_id, status, is_closed, points, effective, status, is_closed, points) 
		history_id = self.insertWithCursor(cursor, insert_sql1, insert_data1)

		# insert into fact table: issue_sprint_map
		insert_sql2 = "insert into issue_sprint_map (issue_id, sprint_id, d_effective) values (?, ?, ?) on conflict (issue_id, d_effective) do update set (sprint_id, t_modified) = (?, current_timestamp) returning id"
		insert_data2 = (issue_id, sprint_id, effective, sprint_id) 
		map_id = self.insertWithCursor(cursor, insert_sql2, insert_data2)

		return history_id, map_id


	def _updateDimensions(self, cursor, issue: dict) -> (int, DeliveryMetricsChangeType):

		# initialize return value
		change_type = DeliveryMetricsChangeType.NONE

		# get values needed for sql statement
		guid = issue.get('guid')
		new_title = issue.get('title')
		new_type = issue.get('type')
		new_opened = self.formatDate(issue.get('opened_date'))
		new_closed = self.formatDate(issue.get('closed_date'))
		new_parent = issue.get('parent_guid')
		new_epic_id = issue.get('epic_id')
		new_values = (new_title, new_type, new_opened, new_closed, new_parent, new_epic_id)

		# select
		select_sql = "select id, title, type, opened_date, closed_date, parent_issue_guid, epic_id from issue where guid = ?"
		select_data = (guid,)
		cursor.execute(select_sql, select_data)
		issue_id, old_title, old_type, old_opened, old_closed, old_parent, old_epic_id = cursor.fetchone()
		old_values = (old_title, old_type, old_opened, old_closed, old_parent, old_epic_id)

		# compare
		if issue_id is not None:
			if (new_values != old_values):
				change_type = DeliveryMetricsChangeType.UPDATE
				update_sql = "update issue set title = ?, type = ?, opened_date = ?, closed_date = ?, parent_issue_guid = ?, epic_id = ?, t_modified = current_timestamp where id = ?"
				update_data = new_values + (issue_id,)	
				cursor.execute(update_sql, update_data)

		return issue_id, change_type

