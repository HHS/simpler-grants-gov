from grants_shared.db.models import base

from . import example_models

metadata = base.metadata

__all__ = ["example_models", "metadata"]
