import uuid

from grants_shared.db.models.base import TimestampMixin
from sqlalchemy import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.models.example_schema_table import ExampleSchemaTable


class ExampleModel(ExampleSchemaTable, TimestampMixin):
    __tablename__ = "example_model"

    example_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    example_title: Mapped[str]

    another_field: Mapped[str | None]

    an_indexed_field: Mapped[str] = mapped_column(index=True)


# TODO - add a lookup table
