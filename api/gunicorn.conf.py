"""
Configuration file for the Gunicorn server used to run the application in production environments.

Attributes:
    bind(str): The socket to bind. Formatted as '0.0.0.0:$PORT'.
    workers(int): The number of worker processes for handling requests.
    threads(int): The number of threads per worker for handling requests.

For more information, see https://docs.gunicorn.org/en/stable/configure.html
"""

import os

from src.app_config import AppConfig

app_config = AppConfig()

bind = app_config.host + ':' + str(app_config.port)
# Calculates the number of usable cores and doubles it. Recommended number of workers per core is two.
# https://docs.gunicorn.org/en/latest/design.html#how-many-workers
# We use 'os.sched_getaffinity(pid)' not 'os.cpu_count()' because it returns only allowable CPUs.
# os.sched_getaffinity(pid): Return the set of CPUs the process with PID pid is restricted to.
# os.cpu_count(): Return the number of CPUs in the system.
# workers = len(os.sched_getaffinity(0)) * 2

# Until we figure out better math, ignore the above. Hardcoding # workers because Python gets EC2 CPU not Fargate
# 1 vCPU is equivalent to 1 core of a hyperthreaded processor, which will give you 1 physical core & 2 threads
workers = 2
threads = 4
