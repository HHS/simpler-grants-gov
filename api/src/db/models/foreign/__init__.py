#
# SQLAlchemy models for foreign tables.
#

from . import (
    application,
    attachment,
    certificates,
    competition,
    forecast,
    foreignbase,
    instructions,
    opportunity,
    synopsis,
    tgroups,
    user,
)

metadata = foreignbase.metadata

__all__ = [
    "metadata",
    "application",
    "forecast",
    "opportunity",
    "synopsis",
    "tgroups",
    "attachment",
    "user",
    "competition",
    "instructions",
    "certificates",
]
