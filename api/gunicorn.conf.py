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

bind = app_config.host + ":" + str(app_config.port)
# Calculates the number of usable cores and doubles it. Recommended number of workers per core is two.
# https://docs.gunicorn.org/en/latest/design.html#how-many-workers
# We use 'os.sched_getaffinity(pid)' not 'os.cpu_count()' because it returns only allowable CPUs.
# os.sched_getaffinity(pid): Return the set of CPUs the process with PID pid is restricted to.
# os.cpu_count(): Return the number of CPUs in the system.

workers = (len(os.sched_getaffinity(0)) * 2) + 1
threads = 4

# Set the worker class explicitly. This is redundant: gunicorn already auto-promotes the
# default 'sync' worker to 'gthread' whenever threads > 1. We state it
# anyway so the concurrency model is obvious and doesn't silently revert to one-request-
# per-worker 'sync' if the thread count is ever lowered to 1.
worker_class = "gthread"

# Set keepalive higher than ALB idle timeout (120s) to prevent connection pool exhaustion.
# When gunicorn's keepalive is lower than ALB's idle timeout, gunicorn closes connections
# that ALB thinks are still alive, leading to 502 errors and worker exhaustion during
# long-running streaming requests. Setting this to 125s ensures ALB always closes first.
# See: https://lincolnloop.com/blog/gunicorn-keepalive-and-aws-elb-502-errors/
keepalive = 125
