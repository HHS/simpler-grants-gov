from os.path import dirname, abspath
import time

class DeliveryMetricsConfig:

	def __init__(self, datestamp):

		# path to sqlite db instance
		self._DB_PATH = dirname(dirname(dirname(abspath(__file__)))) + "/db/delivery_metrics.db"

		# datestamp to use as "effective date" when writing facts to db
		if isinstance(datestamp, time.struct_time):
			self._EFFECTIVE_DATE = time.strftime("%Y-%m-%d", datestamp)
		else:
			t = time.gmtime()
			self._EFFECTIVE_DATE = time.strftime("%Y-%m-%d", t)


	def dbPath(self):
		return self._DB_PATH

	
	def effectiveDate(self):
		return self._EFFECTIVE_DATE
	
