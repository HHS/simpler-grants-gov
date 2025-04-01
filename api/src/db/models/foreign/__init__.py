#
# SQLAlchemy models for foreign tables.
#

from . import attachment, forecast, foreignbase, opportunity, synopsis, tgroups, user

metadata = foreignbase.metadata

__all__ = [
    "metadata",
    "forecast",
    "opportunity",
    "synopsis",
    "tgroups",
    "attachment",
    "user",
]
