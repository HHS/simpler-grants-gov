import inspect

import tests.db.models.factories as factories
from tests.lib.seed_local_db import run_seed_logic


def test_run_seed_logic_can_run_multiple_times(db_session, enable_factory_create):
    # A few times when modifying our seed script we've modified it
    # in a way that if you run it multiple times, it breaks
    run_seed_logic(db_session)

    # The most common reason we hit issues with rerunning the seed script
    # is relying on a factory sequence that starts from 0 each time populating
    # a unique column. So, between runs, reset the sequence on all factories.
    factory_members = inspect.getmembers(factories)
    for _, obj in factory_members:
        if inspect.isclass(obj) and issubclass(obj, factories.BaseFactory):
            obj.reset_sequence()

    run_seed_logic(db_session)
