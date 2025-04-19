from . import attachment, competition, forecast, opportunity, staging_base, synopsis, tgroups, user

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
]
