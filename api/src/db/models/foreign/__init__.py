#
# SQLAlchemy models for foreign tables.
#

from . import (
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
