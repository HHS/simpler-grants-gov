import datetime
from typing import Any, Iterable

import sqlalchemy
from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column

from src.constants.schema import Schemas
from src.util import datetime_util

metadata = sqlalchemy.MetaData(
    naming_convention={
        "ix": "%(table_name)s_%(column_0_name)s_idx",
        "uq": "%(table_name)s_%(column_0_name)s_uniq",
        "ck": "%(table_name)s_`%(constraint_name)s_check`",
        "fk": "%(table_name)s_%(column_0_name)s_%(referred_table_name)s_fkey",
        "pk": "%(table_name)s_pkey",
    }
)


class StagingBase(sqlalchemy.orm.DeclarativeBase):
    metadata = metadata

    __table_args__ = {"schema": Schemas.STAGING}

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


def same_as_created_at(context: Any) -> Any:
    return context.get_current_parameters()["created_at"]


@declarative_mixin
class StagingParamMixin:
    is_deleted: Mapped[bool]
    transformed_at: Mapped[datetime.datetime | None] = mapped_column(index=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        nullable=False,
        default=datetime_util.utcnow,
        server_default=sqlalchemy.sql.functions.now(),
    )

    updated_at: Mapped[datetime.datetime] = mapped_column(
        nullable=False,
        default=same_as_created_at,
        onupdate=datetime_util.utcnow,
        server_default=sqlalchemy.sql.functions.now(),
    )

    deleted_at: Mapped[datetime.datetime | None] = mapped_column(
        nullable=True,
        default=None,
        server_default=None,
    )
