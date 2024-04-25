#
# SQLAlchemy base model and metadata for foreign tables.
#
# These are defined in a separate sqlalchemy.MetaData object as they are managed differently:
#  - The tables are actually foreign tables connected to the source Oracle database in most environments.
#  - System components should not access them, except transform related components.
#  - Migrations are not used to manage creation and changes as the tables are actually defined in a different system.
#

import datetime
from typing import Any, Iterable

import sqlalchemy

from src.constants.schema import Schemas

metadata = sqlalchemy.MetaData()


class ForeignBase(sqlalchemy.orm.DeclarativeBase):
    metadata = metadata

    __table_args__ = {"schema": Schemas.LEGACY}

    # These types are selected so that the underlying Oracle types are mapped to a more general
    # type. For example all CHAR and VARCHAR types can be mapped to TEXT for simplicity. See
    # https://github.com/laurenz/oracle_fdw?tab=readme-ov-file#data-types
    type_annotation_map = {
        int: sqlalchemy.BigInteger,
        str: sqlalchemy.Text,
        datetime.datetime: sqlalchemy.TIMESTAMP(timezone=True),
    }

    def _dict(self) -> dict:
        return {c.key: getattr(self, c.key) for c in sqlalchemy.inspect(self).mapper.column_attrs}

    def __repr__(self) -> str:
        return f"<{type(self).__name__}({self._dict()!r})"

    def __rich_repr__(self) -> Iterable[tuple[str, Any]]:
        """Rich repr for interactive console.
        See https://rich.readthedocs.io/en/latest/pretty.html#rich-repr-protocol
        """
        return self._dict().items()
