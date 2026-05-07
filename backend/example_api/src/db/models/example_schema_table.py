from typing import Any

from grants_shared.db.models.base import Base


class ExampleSchemaTable(Base):

    __abstract__ = True
    # TODO - schema
    __table_args: Any = {"schema": "example"}
