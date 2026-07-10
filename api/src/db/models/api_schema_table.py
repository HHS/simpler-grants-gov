from typing import Any

import grants_shared.db.models.base as base

from src.constants.schema import Schemas

# Re-export the metadata we're using as it's needed in a few places
metadata = base.metadata


class ApiSchemaTable(base.Base):
    __abstract__ = True

    __table_args__: Any = {"schema": Schemas.API}
