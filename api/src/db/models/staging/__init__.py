from . import (
    attachment,
    certificates,
    competition,
    forecast,
    instructions,
    opportunity,
    staging_base,
    synopsis,
    tgroups,
    user,
)

metadata = staging_base.metadata

__all__ = [
    "metadata",
    "opportunity",
    "forecast",
    "synopsis",
    "tgroups",
    "attachment",
    "user",
    "competition",
    "instructions",
    "certificates",
]
