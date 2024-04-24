#
# SQLAlchemy models for foreign tables.
#

from . import forecast, foreignbase, opportunity, synopsis

metadata = foreignbase.metadata

__all__ = ["metadata", "forecast", "opportunity", "synopsis"]
