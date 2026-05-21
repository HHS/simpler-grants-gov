"""
This is a smoke test we run as part of the release process.

We run it to verify that we're able to successfully import
the grants_shared code and didn't mess up the build process
before we push it to PyPi.
"""

# we want to print before imports in case they fail
# as the imports are all we're testing here.
print("Running smoke test.")  # noqa: T201
from datetime import datetime  # noqa: E402

import grants_shared.util.datetime_util as datetime_util  # noqa: E402

now = datetime_util.utcnow()

if not isinstance(now, datetime):
    raise Exception("utcnow from our datetime util was an unexpected type %s" % type(now))

print("Smoke test successful.")  # noqa: T201
