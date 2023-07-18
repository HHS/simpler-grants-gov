import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import TIMESTAMP, Column, MetaData, inspect
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.declarative import as_declarative
from sqlalchemy.orm import declarative_mixin
from sqlalchemy.sql.functions import now as sqlnow

from src.util import datetime_util

# Override the default naming of constraints
# to use suffixes instead:
# https://stackoverflow.com/questions/4107915/postgresql-default-constraint-names/4108266#4108266
metadata = MetaData(
    naming_convention={
        "ix": "%(column_0_label)s_idx",
        "uq": "%(table_name)s_%(column_0_name)s_uniq",
        "ck": "%(table_name)s_`%(constraint_name)s_check`",
        "fk": "%(table_name)s_%(column_0_name)s_%(referred_table_name)s_fkey",
        "pk": "%(table_name)s_pkey",
    }
)


@as_declarative(metadata=metadata)
class Base:
    def _dict(self) -> dict:
        return {c.key: getattr(self, c.key) for c in inspect(self).mapper.column_attrs}

    def for_json(self) -> dict:
        json_valid_dict = {}
        dictionary = self._dict()
        for key, value in dictionary.items():
            if isinstance(value, UUID) or isinstance(value, Decimal):
                json_valid_dict[key] = str(value)
            elif isinstance(value, date) or isinstance(value, datetime):
                json_valid_dict[key] = value.isoformat()
            else:
                json_valid_dict[key] = value

        return json_valid_dict

    def copy(self, **kwargs: dict[str, Any]) -> "Base":
        # TODO - Python 3.11 will let us make the return Self instead
        table = self.__table__  # type: ignore
        non_pk_columns = [
            k for k in table.columns.keys() if k not in table.primary_key.columns.keys()
        ]
        data = {c: getattr(self, c) for c in non_pk_columns}
        data.update(kwargs)
        copy = self.__class__(**data)
        return copy


@declarative_mixin
class IdMixin:
    """Mixin to add a UUID id primary key column to a model
    https://docs.sqlalchemy.org/en/14/orm/declarative_mixins.html
    """

    id: uuid.UUID = Column(postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def same_as_created_at(context: Any) -> Any:
    return context.get_current_parameters()["created_at"]


@declarative_mixin
class TimestampMixin:
    """Mixin to add created_at and updated_at columns to a model
    https://docs.sqlalchemy.org/en/14/orm/declarative_mixins.html#mixing-in-columns
    """

    created_at: datetime = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=datetime_util.utcnow,
        server_default=sqlnow(),
    )

    updated_at: datetime = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        default=same_as_created_at,
        onupdate=datetime_util.utcnow,
        server_default=sqlnow(),
    )
