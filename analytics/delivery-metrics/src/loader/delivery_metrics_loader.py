import json
import sys
from delivery_metrics_config import DeliveryMetricsConfig
from delivery_metrics_database import DeliveryMetricsDatabase
from delivery_metrics_deliverable_model import DeliveryMetricsDeliverableModel
from delivery_metrics_epic_model import DeliveryMetricsEpicModel
from delivery_metrics_issue_model import DeliveryMetricsIssueModel
from delivery_metrics_model import DeliveryMetricsChangeType
from delivery_metrics_sprint_model import DeliveryMetricsSprintModel
from delivery_metrics_quad_model import DeliveryMetricsQuadModel
from typing import TextIO


class DeliveryMetricsDataLoader:

	def __init__(self, config: DeliveryMetricsConfig, file_path: str):
		self.config = config
		self.file_path = file_path
		self.data = None
		self.unique_quads = {}
		self.unique_deliverables = {}
		self.unique_sprints = {}
		self.unique_epics = {}
		self.unique_issues = {}


	""" public methods """


	def loadData(self) -> None:
		# read file
		try:
			print("opening file '{}'".format(self.file_path))
			with open(self.file_path, 'r') as f:
				self._readFile(f)
				f.close()
		except IOError:
			print("Fatal error: unable to read file: {}".format(self.file_path))
			sys.exit()

		# parse data
		self._parseData()

		# write to database
		self._persistData()


	def removePrefixFromGuid(self, guid: str) -> str:

		if isinstance(guid, str) and guid is not None:
			prefix = 'https://github.com/'
			if guid.startswith(prefix):
				return guid.replace(prefix, '')

		return guid


	""" private methods """


	def _readFile(self, file_handle: TextIO) -> None:
		try:
			self.data = json.load(file_handle)
		except json.JSONDecodeError:
			print("FATAL: unable to read json")
			sys.exit()

	
	def _parseData(self) -> (dict, dict, dict):
		
		self.unique_quads = {}
		self.unique_deliverables = {}
		self.unique_sprints = {}
		self.unique_epics = {}
		self.unique_issues = {}

		print("parsing json")
		print("found {} items to process".format(str(len(self.data))))

		for item in self.data:

			# validate
			if not isinstance(item, dict):
				continue 
			
			# parse and de-duplicate quads, deliverables, sprints, epics
			quad_guid = self._extractQuad(item)
			deliverable_guid = self._extractDeliverable(item)
			sprint_guid = self._extractSprint(item)
			epic_guid = self._extractEpic(item)

			# parse and de-duplicate issues
			issue_guid = self._extractIssue(item)
			if issue_guid in self.unique_issues:
				self.unique_issues[issue_guid]['quad_guid'] = quad_guid
				self.unique_issues[issue_guid]['deliverable_guid'] = deliverable_guid
				self.unique_issues[issue_guid]['sprint_guid'] = sprint_guid
				self.unique_issues[issue_guid]['epic_guid'] = epic_guid

		self.data = None


	def _extractQuad(self, item: dict) -> str:

		# validation
		if not isinstance(item, dict):
			return None

		# extract guid
		quad_guid = item.get('quad_id')

		# save to unique map
		if quad_guid is not None and quad_guid not in self.unique_quads:

			quad = {
				'guid': quad_guid,
				'name': item.get('quad_name'),
				'start_date': item.get('quad_start'),
				'end_date': item.get('quad_end'),
				'duration': item.get('quad_length')
			}
			self.unique_quads[quad_guid] = quad

		return quad_guid


	def _extractDeliverable(self, item: dict) -> str:

		# validation
		if not isinstance(item, dict):
			return None

		# extract guid
		deliverable_guid = self.removePrefixFromGuid(item.get('deliverable_url'))

		# save to unique map
		if deliverable_guid is not None and deliverable_guid not in self.unique_deliverables:
		
			deliverable = {
				'guid': deliverable_guid,
				'title': item.get('deliverable_title'),
				'pillar': item.get('deliverable_pillar'),
				'quad_guid': item.get('quad_id'),
				'quad_id': None
			}
			self.unique_deliverables[deliverable_guid] = deliverable

		return deliverable_guid
	

	def _extractSprint(self, item: dict) -> str:

		# validation
		if not isinstance(item, dict):
			return None

		# extract guid
		sprint_guid = item.get('sprint_id')


		# save to unique map
		if sprint_guid is not None and sprint_guid not in self.unique_sprints:
			
			sprint = {
				'guid': sprint_guid,
				'name': item.get('sprint_name'), 
				'start_date': item.get('sprint_start'), 
				'end_date': item.get('sprint_end'),
				'duration': item.get('sprint_length'),
				'quad_guid': item.get('quad_id'),
				'quad_id': None
			}
			self.unique_sprints[sprint_guid] = sprint

		return sprint_guid


	def _extractEpic(self, item: dict) -> str:

		# validation
		if not isinstance(item, dict):
			return None

		# extract guid
		epic_guid = self.removePrefixFromGuid(item.get('epic_url'))

		# save to unique map
		if epic_guid is not None and epic_guid not in self.unique_epics:

			epic = {
				'guid': epic_guid,
				'title': item.get('epic_title'),
				'deliverable_guid': self.removePrefixFromGuid(item.get('deliverable_url'))
			}
			self.unique_epics[epic_guid] = epic

		return epic_guid


	def _extractIssue(self, item: dict) -> str:

		# validation
		if not isinstance(item, dict):
			return None

		# extraction
		issue_guid = self.removePrefixFromGuid(item.get('issue_url'))
		issue_type = item.get('issue_type') or 'Undefined'
		issue = {
			'guid': issue_guid,
			'type': issue_type,
			'title': item.get('issue_title'),
			'points': item.get('issue_points'),
			'status': item.get('issue_status'), 
			'opened_date': item.get('issue_opened_at'), 
			'closed_date': item.get('issue_closed_at'), 
			'is_closed': item.get('issue_is_closed'), 
			'parent_guid': self.removePrefixFromGuid(item.get('issue_parent')),
			'quad_guid': None,
			'deliverable_guid': None,
			'sprint_guid': None,
			'epic_guid': None
		}

		# save to unique map
		if issue_guid is not None:
			if issue_type in ['Task', 'Bug', 'Enhancement', 'Undefined']:
				self.unique_issues[issue_guid] = issue

		return issue_guid


	def _persistData(self):

		# initialize models
		db = DeliveryMetricsDatabase(self.config)
		deliverableModel = DeliveryMetricsDeliverableModel(db)
		epicModel = DeliveryMetricsEpicModel(db)
		issueModel = DeliveryMetricsIssueModel(db)
		sprintModel = DeliveryMetricsSprintModel(db)
		quadModel = DeliveryMetricsQuadModel(db)

		# initialize maps
		quad_guid_map = {}
		deliverable_guid_map = {}
		sprint_guid_map = {}
		epic_guid_map = {}

		# initialize status counters
		insert_count = {
			'quads': 0,
			'deliverables': 0,
			'sprints': 0,
			'epics': 0,
			'issues': 0
		}
		update_count = dict(insert_count)

		print("persisting data")

		# for each quad
		for guid, quad in self.unique_quads.items():

			# write to db
			quad_id, change_type = quadModel.syncQuad(quad)

			# save mapping of guid to db row id
			if quad_id is not None:
				quad_guid_map[guid] = quad_id

			# save change type for reporting purposes
			if change_type == DeliveryMetricsChangeType.INSERT:
				insert_count['quads'] += 1
			elif change_type == DeliveryMetricsChangeType.UPDATE:
				update_count['quads'] += 1

		# summarize results of quad inserts/updates
		print("quad row(s) inserted: {}".format(insert_count['quads']))
		print("quad row(s) updated: {}".format(update_count['quads']))

		# for each deliverable 
		for guid, deliverable in self.unique_deliverables.items():

			new_deliverable = dict(deliverable)

			# convert guids to ids
			quad_guid = deliverable.get('quad_guid')
			new_deliverable['quad_id'] = quad_guid_map.get(quad_guid)

			# write to db
			deliverable_id, change_type = deliverableModel.syncDeliverable(new_deliverable)

			# save mapping of guid to db row id
			if deliverable_id is not None:
				deliverable_guid_map[guid] = deliverable_id

			# save change type for reporting purposes
			if change_type == DeliveryMetricsChangeType.INSERT:
				insert_count['deliverables'] += 1
			elif change_type == DeliveryMetricsChangeType.UPDATE:
				update_count['deliverables'] += 1

		# summarize results of deliverable inserts/updates
		print("deliverable row(s) inserted: {}".format(insert_count['deliverables']))
		print("deliverable row(s) updated: {}".format(update_count['deliverables']))

		# for each sprint 
		for guid, sprint in self.unique_sprints.items():

			new_sprint = dict(sprint)

			# convert guids to ids
			quad_guid = sprint.get('quad_guid')
			new_sprint['quad_id'] = quad_guid_map.get(quad_guid)

			# write to db
			sprint_id, change_type = sprintModel.syncSprint(new_sprint)

			# save mapping of guid to db row id
			if sprint_id is not None:
				sprint_guid_map[guid] = sprint_id

			# save change type for reporting purposes
			if change_type == DeliveryMetricsChangeType.INSERT:
				insert_count['sprints'] += 1
			elif change_type == DeliveryMetricsChangeType.UPDATE:
				update_count['sprints'] += 1

		# summarize results of sprint inserts/updates
		print("sprint row(s) inserted: {}".format(insert_count['sprints']))
		print("sprint row(s) updated: {}".format(update_count['sprints']))

		# for each epic 
		for guid, epic in self.unique_epics.items():

			new_epic = dict(epic)

			# convert guids to ids
			deliverable_guid = epic.get('deliverable_guid')
			new_epic['deliverable_id'] = deliverable_guid_map.get(deliverable_guid)

			# write to db
			epic_id, change_type = epicModel.syncEpic(new_epic)

			# save mapping of guid to db row id
			if epic_id is not None:
				epic_guid_map[guid] = epic_id

			# save change type for reporting purposes
			if change_type == DeliveryMetricsChangeType.INSERT:
				insert_count['epics'] += 1
			elif change_type == DeliveryMetricsChangeType.UPDATE:
				update_count['epics'] += 1

		# summarize results of epic inserts/updates
		print("epic row(s) inserted: {}".format(insert_count['epics']))
		print("epic row(s) updated: {}".format(update_count['epics']))

		# for each issue 
		for guid, issue in self.unique_issues.items():

			new_issue = dict(issue)

			# convert guids to ids
			epic_guid = issue.get('epic_guid')
			sprint_guid = issue.get('sprint_guid')
			new_issue['epic_id'] = epic_guid_map.get(epic_guid)
			new_issue['sprint_id'] = sprint_guid_map.get(sprint_guid)
			del new_issue['epic_guid']
			del new_issue['sprint_guid']

			# write to db
			issue_id, change_type = issueModel.syncIssue(new_issue)

			# save change type for reporting purposes
			if change_type == DeliveryMetricsChangeType.INSERT:
				insert_count['issues'] += 1
			elif change_type == DeliveryMetricsChangeType.UPDATE:
				update_count['issues'] += 1

		# summarize results of epic inserts/updates
		print("issue row(s) inserted: {}".format(insert_count['issues']))
		print("issue row(s) updated: {}".format(update_count['issues']))

