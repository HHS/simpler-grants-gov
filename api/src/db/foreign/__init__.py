#
# SQLAlchemy models for foreign tables.
#

from . import forecast, foreignbase, opportunity, synopsis, tgroups

metadata = foreignbase.metadata

__all__ = ["metadata", "forecast", "opportunity", "synopsis", "tgroups"]
