import uuid
from typing import Any

from sqlalchemy import UUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from grants_shared.db.models.base import Base, TimestampMixin

# We don't have actual DB tables or DB migrations in grants_shared
# but want the ability to test DB interactions with tables. To do that
# we'll define SQLAlchemy models here.

################################
# Base tables
#
# Where the schemas for a given table are connected
################################


class GrantsSharedSchemaTable(Base):
    __abstract__ = True

    __table_args__: Any = {"schema": "grants_shared"}


class OtherSchemaTable(Base):
    __abstract__ = True

    __table_args__: Any = {"schema": "other"}


class ExampleTable(GrantsSharedSchemaTable, TimestampMixin):
    __tablename__ = "example"

    example_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    description: Mapped[str]
    my_count: Mapped[int | None]


class FriendTable(OtherSchemaTable, TimestampMixin):
    __tablename__ = "friend"

    friend_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    best_example_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(ExampleTable.example_id))
    best_example: Mapped[ExampleTable] = relationship(ExampleTable)
