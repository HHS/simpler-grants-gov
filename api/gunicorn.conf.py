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

# Format bind address properly for IPv6 (requires square brackets)
# IPv6 addresses like :: need to be wrapped as [::]:port
if ':' in app_config.host and not app_config.host.startswith('['):
    bind = f'[{app_config.host}]:{app_config.port}'
else:
    bind = f'{app_config.host}:{app_config.port}'
# Calculates the number of usable cores and doubles it. Recommended number of workers per core is two.
# https://docs.gunicorn.org/en/latest/design.html#how-many-workers
# We use 'os.sched_getaffinity(pid)' not 'os.cpu_count()' because it returns only allowable CPUs.
# os.sched_getaffinity(pid): Return the set of CPUs the process with PID pid is restricted to.
# os.cpu_count(): Return the number of CPUs in the system.
# Allow WEB_CONCURRENCY env var to override the calculated workers (useful for e2e testing)

workers = int(os.environ.get("WEB_CONCURRENCY", (len(os.sched_getaffinity(0)) * 2) + 1))
threads = 4

# Timeout for worker processes (default is 30s, increase for e2e tests with slow operations)
# Workers are killed and restarted if they don't respond within this time
timeout = int(os.environ.get("GUNICORN_TIMEOUT", 120))

# Keep-Alive connection timeout (default is 2s)
# How long to wait for requests on a Keep-Alive connection
keepalive = int(os.environ.get("GUNICORN_KEEPALIVE", 5))

# Graceful timeout for worker shutdown (default is 30s)
# Allows workers to finish handling requests before being killed
graceful_timeout = int(os.environ.get("GUNICORN_GRACEFUL_TIMEOUT", 120))

# Max requests per worker before recycling (default is 0 = disabled)
# Prevents memory leaks by restarting workers after handling N requests
# Use in CI to prevent long-running degradation during multi-browser e2e tests
max_requests = int(os.environ.get("GUNICORN_MAX_REQUESTS", 0))

# Randomize max_requests to avoid all workers restarting simultaneously
# Adds 0 to N jitter to max_requests value
max_requests_jitter = int(os.environ.get("GUNICORN_MAX_REQUESTS_JITTER", 0))
