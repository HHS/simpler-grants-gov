"""
This is a smoke test we run as part of the release process.
This DOES NOT run as a unit test.

We run it to verify that we're able to successfully import
the grants_shared code and didn't mess up the build process
before we push it to PyPi.


"""


def main():
    """
    Run the smoke test.

    We don't do imports until this function begins running
    as we're testing the imports work and want to have
    print output to verify where it is if it fails.
    """
    print("Running smoke test.")  # noqa: T201
    from datetime import datetime

    import grants_shared.util.datetime_util as datetime_util

    now = datetime_util.utcnow()

    if not isinstance(now, datetime):
        raise Exception("utcnow from our datetime util was an unexpected type %s" % type(now))

    print("Smoke test successful.")  # noqa: T201


# Run inside of a main function so that importing the file
# doesn't cause it to run, only if it's directly invoked.
if __name__ == "__main__":
    main()
