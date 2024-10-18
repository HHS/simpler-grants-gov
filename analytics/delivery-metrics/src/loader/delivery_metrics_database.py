import sqlite3
import sys
from delivery_metrics_config import DeliveryMetricsConfig

class DeliveryMetricsDatabase:

	def __init__(self, config: DeliveryMetricsConfig):

		self.config = config
		self._dbConnection = None


	def __del__(self):

		self.disconnect()


	def getEffectiveDate(self) -> str:

		return self.config.effectiveDate()


	def connection(self) -> sqlite3.Connection:

		if not self._dbConnection:
			try:
				db_uri = "file:{}?mode=rw".format(self.config.dbPath())
				print("connecting to database '{}'".format(db_uri))
				self._dbConnection = sqlite3.connect(db_uri, uri=True)
			except sqlite3.Error as error:
				print("WARNING: {}: {}".format(error, self.config.dbPath()))

		return self._dbConnection
	

	def commit(self) -> None:

		if not self._dbConnection:
			print("WARNING: unable to commit transaction")
			return

		try:
			self._dbConnection.commit()
		except sqlite3.Error as error:
			print("WARNING: {}".format(error))


	def cursor(self) -> sqlite3.Cursor:

		db_cursor = None
		try:
			db_cursor = self.connection().cursor()
		except:
			print("FATAL: cannot get database cursor")
			sys.exit()

		return db_cursor


	def disconnect(self) -> None:
	
		if self._dbConnection is not None:
			print("closing db connection")
			try:
				self._dbConnection.close()
			except:
				pass

		self._dbConnection = None

	

