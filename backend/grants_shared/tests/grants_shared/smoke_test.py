"""
This is a smoke test we run as part of the release process.

We run it to verify that we're able to successfully import
the grants_shared code and didn't mess up the build process
before we push it to PyPi.
"""
print("Running smoke test.")
from datetime import datetime

import grants_shared.util.datetime_util as datetime_util

now = datetime_util.utcnow()

if not isinstance(now, datetime):
    raise Exception("utcnow from our datetime util was an unexpected type %s" % type(now))

print("Smoke test successful.")