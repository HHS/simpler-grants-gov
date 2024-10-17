#!/usr/bin/env python3

from os.path import dirname, abspath
import sys
sys.path.insert(0, dirname(abspath(__file__)) + '/loader')

from argparse import ArgumentParser
from delivery_metrics_config import DeliveryMetricsConfig
from delivery_metrics_database import DeliveryMetricsDatabase
import functools 
import time


class DeliveryMetricsPercentComplete:

	def __init__(self, config, verbose=False):
		self.config = config
		self.dbh = DeliveryMetricsDatabase(config)
		self.max_effective_date = config.effectiveDate()
		self.verbose = verbose
		self._found_some = False


	def calculate(self):

		# initialize cursor
		cursor = self.dbh.cursor()

		# iterate quads
		quads = self.getQuads(cursor)
		for quad_id, quad_name in quads.items():

			# output
			print("[QUAD] {}".format(quad_name))

			# iterate deliverables
			deliverables = self.getDeliverables(cursor, quad_id)
			for deliverable_id, d in deliverables.items():

				# output
				print("\t[DELIVERABLE] {} (effective {})".format(d.get('title'), d.get('effective')))

				# initialize counters
				total = DeliveryMetricsPercentCompleteTotals()
			
				# iterate epics
				epics = self.getEpics(cursor, deliverable_id)
				for epic_id, e in epics.items():
				
					# output
					if self.verbose:
						print("\t\t[EPIC] {} (effective {})".format(e.get('title'), e.get('effective') )) 
				
					# iterate issues
					issues = self.getIssues(cursor, epic_id)
					for issue_id, i in issues.items():
					
						# output
						if self.verbose:
							print("\t\t\t[ISSUE] {} (effective {}, points={}, closed={})".format(i.get('title'), i.get('effective'), i.get('points'), i.get('closed')))

						# increment counters
						self._found_some = True
						total.issues += 1
						total.points += i.get('points', 0)
						if i.get('closed', False):
							total.issues_closed +=1
							total.points_closed += i.get('points', 0)

					# end issue iteration loop

				# end epic iteration loop

				# calculate and output results
				total.printResults()

			# end deliverable iteration loop
			
		# end quad iteration loop

		# close cursor
		cursor.close()

		# output if no results found
		if self._found_some is False:
			print("no results found")


	def getQuads(self, cursor):

		# init data store
		quads = dict()

		# define sql
		sql = '''
			select
				id,
				name
			from 
				quad
			where
				start_date <= ?
		'''

		# get quads
		cursor.execute(sql, (self.max_effective_date,))
		all_rows = cursor.fetchall()
		for row in all_rows:
			q_id = row[0]
			quads[q_id] = row[1]

		return quads


	def getDeliverables(self, cursor, quad_id):

		# init data store
		deliverables = dict()

		# define sql
		sql = ''' 
			select 
				deliverable_id,
				max(d_effective),
				d.title 
			from 
				deliverable_quad_map m 
			inner join deliverable d on d.id = m.deliverable_id
			where
				quad_id = ? and
				d_effective <= ?
			group by deliverable_id
		'''

		# get deliverables
		cursor.execute(sql, (quad_id, self.max_effective_date))
		all_rows = cursor.fetchall()
		for row in all_rows: 
			d_id = row[0]
			deliverables[d_id] = {
				'effective': row[1],
				'title': row[2]
			}

		return deliverables
	

	def getEpics(self, cursor, deliverable_id):

		# init data store
		epics = dict()

		# define sql
		sql = '''
			select 
				epic_id,
				max(d_effective),
				e.title 
			from 
				epic_deliverable_map m
			inner join epic e on e.id = m.epic_id 
			where 
				deliverable_id = ? and
				d_effective <= ?
			group by epic_id
		'''

		# get epics
		cursor.execute(sql, (deliverable_id, self.max_effective_date))
		all_rows = cursor.fetchall()
		for row in all_rows: 
			e_id = row[0]
			epics[e_id] = {
				'effective': row[1],
				'title': row[2]
			}

		return epics


	def getIssues(self, cursor, epic_id):

		# init data store
		issues = dict()

		# define sql
		sql = '''
			select 
				issue_id,
				max(d_effective),
				points,
				is_closed,
				i.title
			from 
				issue_history h 
			inner join issue i on i.id = h.issue_id 
			where 
				epic_id = ? and
				d_effective <= ?
			group by issue_id
		'''

		# get issues
		cursor.execute(sql, (epic_id, self.max_effective_date))
		all_rows = cursor.fetchall()
		for row in all_rows:
			i_id = row[0]
			issues[i_id] = {
				'effective': row[1],
				'points': row[2],
				'closed': bool(row[3]),
				'title': row[4]
			}
		
		return issues


class DeliveryMetricsPercentCompleteTotals:

	def __init__(self):

		self.issues = 0
		self.issues_closed = 0
		self.points = 0
		self.points_closed = 0

	
	def printResults(self):

		percent_complete_issues = 0
		percent_complete_points = 0

		if self.issues > 0:
			percent_complete_issues = round(100*(self.issues_closed / self.issues), 1)
		if self.points > 0:
			percent_complete_points = round(100*(self.points_closed / self.points), 1)

		print("\t\tTotal Issues: {}".format(str(self.issues)))
		print("\t\tTotal Issues Closed: {}".format(str(self.issues_closed)))
		print("\t\tIssues Complete: {}%".format(str(percent_complete_issues)))
		print("\t\tTotal Points: {}".format(str(self.points)))
		print("\t\tTotal Points Closed: {}".format(str(self.points_closed)))
		print("\t\tPoints Complete: {}%".format(str(percent_complete_points)))


if __name__ == "__main__":

	def parseDateArg(d):
		return time.strptime(d, '%Y%m%d')

	# define command line args
	parser = ArgumentParser(description="Calculate % complete of deliverables in delivery metrics database")
	parser.add_argument("-e", dest="yyyymmdd", type=parseDateArg, help="effective date to use in metrics calculation")
	parser.add_argument("-v", "--verbose", action="store_true", help="increase output verbosity")

	# get command line args
	args = parser.parse_args()

	# initialize config object
	config = DeliveryMetricsConfig(args.yyyymmdd)
	
	# calculate metrics
	print("...")
	print("calculating metrics with effective date <= {}".format(config.effectiveDate()))
	print("verbose mode is {state}".format(state="ON" if args.verbose else "OFF"))
	metrics = DeliveryMetricsPercentComplete(config, args.verbose)
	metrics.calculate()
	print("metrics calculations are done")


