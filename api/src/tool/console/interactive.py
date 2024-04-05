#
# Interactive console for using database and services.
#
# Connects to the database then drops into a Python interactive prompt.
#
# Use via the `-i` flag to python, for example:
#   poetry run python3 -i -m src.tool.console.interactive
#

from types import ModuleType

import rich
import rich.panel
import rich.pretty

import src.adapters.db as db
import src.db
import src.db.models
import src.logging
import src.util
import tests.src.db.models.factories
from src.adapters.db.clients.postgres_client import PostgresDBClient
from src.adapters.db.clients.postgres_config import get_db_config

INTRO = """
Simpler Grants Gov Python console

Useful things:

│ dbs = database session {db_session}
│ f = DB factories module
│ u = utilities module
│ r = function to reload REPL

Examples:

│ dbs.query(Opportunity).first()
| f.OpportunityFactory.create()

Tips:

★ Tab-completion is available
★ History is available (use ↑↓ keys)
★ Use Ctrl+D to exit
"""


def interactive_console() -> dict:
    """Set up variables and print a introduction message for the interactive console."""

    db_session = connect_to_database()

    print(INTRO.format(**locals()))

    variables = dict()
    variables.update(vars(src.db.models.opportunity_models))
    variables.update(vars(src.db.models.lookup_models))

    # This goes after the imports of entire modules, so the console reserved
    # names (db, fineos, etc) take precedence. This might break some modules
    # that expect something different under those names.
    variables.update(locals())

    # DB
    variables["db_session"] = db_session
    variables["dbs"] = db_session

    # DB Factories
    factories_module = tests.src.db.models.factories
    if isinstance(db_session, db.Session):
        factories_module._db_session = db_session
    variables["f"] = tests.src.db.models.factories

    # Easy access to utilities
    variables["u"] = src.util
    variables["util"] = src.util

    # Easy reloading of modules imported in REPL, for retrying something after a
    # code change without dropping out of REPL
    variables["r"] = reload_repl
    variables["reload"] = reload_repl
    variables["reload_module"] = reload_module

    return variables


def connect_to_database() -> db.Session | Exception:
    db_config = get_db_config()

    # errors sometimes dump sensitive info
    # (since we're doing locally, we don't need to hide)
    db_config.hide_sql_parameter_logs = False
    db_session: db.Session | Exception
    try:
        db_session = PostgresDBClient(db_config).get_session()
    except Exception as err:
        db_session = err

    return db_session


def reload_repl() -> None:
    import importlib
    from sys import modules

    for module in set(modules.values()):
        # only reload our code
        if "<module 'src." not in str(module):
            continue

        # individual database model modules can be particular in how they are
        # loaded, so don't automatically reload them
        if "<module 'src.db.models." in str(module):
            continue

        # reloading the logging initialization and stuff can cause some issues,
        # avoid it all for now
        if "<module 'src.util.logging" in str(module):
            continue

        try:
            importlib.reload(module)
        except Exception:  # noqa: B001
            # there are some problems that are swept under the rug here
            pass


def reload_module(m: ModuleType) -> None:
    import importlib

    importlib.reload(m)


if __name__ == "__main__":
    with src.logging.init(__package__):
        interactive_variables = interactive_console()
        globals().update(interactive_variables)
        rich.pretty.install(indent_guides=True, max_length=20, max_string=400)
