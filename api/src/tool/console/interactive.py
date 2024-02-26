#
# Interactive console for using database and services.
#
# Connects to the database then drops into a Python interactive prompt.
#
# Use via the `-i` flag to python, for example:
#   poetry run python3 -i -m src.tool.console.interactive
#

import logging
from typing import Union

import rich
import rich.panel
import rich.pretty
import sqlalchemy

import src.db
import src.db.models
import src.logging
import src.util
import tests.src.db.models.factories
from src.adapters.db.clients.postgres_config import PostgresDBConfig, get_db_config

INTRO = """
Simpler Grants Gov Python console

Useful things:

│ db = database session (Not yet working)
│ f = DB factories module
│ u = utilities module
│ r = function to reload REPL

Tips:
★ Tab-completion is available
★ History is available (use ↑↓ keys)
★ Use Ctrl+D to exit
"""


def interactive_console() -> dict:
    """Set up variables and print a introduction message for the interactive console."""

    db = connect_to_database()

    print(INTRO.format(**locals()))

    variables = dict()
    variables.update(vars(src.db.models.opportunity_models))

    # This goes after the imports of entire modules, so the console reserved
    # names (db, fineos, etc) take precedence. This might break some modules
    # that expect something different under those names.
    # variables.update(locals())

    # DB Factories
    # factories_module = tests.src.db.models.factories

    # if isinstance(db, sqlalchemy.orm.scoped_session):
    #     factories_module.db_session = db

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


def connect_to_database() -> PostgresDBConfig:
    db_config = get_db_config()
    db_config.hide_sql_parameter_logs = False
    db: Union[sqlalchemy.orm.scoped_session, Exception]
    try:
        db = tests.src.db.init(config=db_config, sync_lookups=True)
    except Exception as err:
        db = err

    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)  # noqa: B1
    return db


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
        except:  # noqa: B001
            # there are some problems that are swept under the rug here
            pass


def reload_module(m) -> None:
    import importlib

    importlib.reload(m)


if __name__ == "__main__":
    interactive_variables = interactive_console()
    globals().update(interactive_variables)
    rich.pretty.install(indent_guides=True, max_length=20, max_string=400)
