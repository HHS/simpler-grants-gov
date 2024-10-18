#!/usr/bin/env python3

from argparse import ArgumentParser, FileType
from delivery_metrics_config import DeliveryMetricsConfig
from delivery_metrics_loader import DeliveryMetricsDataLoader
import functools 
import os.path 
import time

def parseDateArg(d):
	return time.strptime(d, '%Y%m%d')


if __name__ == "__main__":

	perf_start = time.perf_counter()

	# define command line args
	parser = ArgumentParser(description="Load a json file into the delivery metrics database")
	group = parser.add_mutually_exclusive_group(required=True)
	group.add_argument("file", type=FileType("r"), nargs="?", metavar="FILEPATH", help="path of json file to load")
	parser.add_argument("-e", dest="yyyymmdd", type=parseDateArg, help="effective date to apply to records in json file")

	# get command line args
	args = parser.parse_args()
	args.file.close()
	file_path = os.path.abspath(args.file.name)

	# initialize config object
	config = DeliveryMetricsConfig(args.yyyymmdd)

	# load data
	print("...\nrunning data loader with effective date {}".format(config.effectiveDate()))
	loader = DeliveryMetricsDataLoader(config, file_path)
	loader.loadData()
	loader = None

	print("data loader is done")

	# measure execution time
	elapsed_time = round(time.perf_counter() - perf_start, 4)
	print("elapsed time: {} seconds".format(elapsed_time))
