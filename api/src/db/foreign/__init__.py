#
# SQLAlchemy models for foreign tables.
#

from . import base, forecast, opportunity, synopsis

metadata = base.metadata

__all__ = ["metadata", "forecast", "opportunity", "synopsis"]
