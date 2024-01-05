from enum import StrEnum
from typing import Any, Type

from sqlalchemy import Text
from sqlalchemy.types import TypeDecorator


class StrEnumColumn(TypeDecorator):
    """
    This class handles converting StrEnum objects into strings when writing to the DB,
    and converting those strings back into the provided StrEnum when reading from the DB.

    Example Usage::

        from enum import StrEnum
        from sqlalchemy.orm import Mapped, mapped_column
        from src.db.models.base import Base, IdMixin, TimestampMixin

        # Define a StrEnum somewhere
        class ExampleEnum(StrEnum):
            VALUE_A = "a"
            VALUE_B = "b"
            VALUE_C = "c"

        # Create your DB model, specifying the column type like so
        class Example(Base, IdMixin, TimestampMixin):
            __tablename__ = "example"

            example_column: Mapped[ExampleEnum] = mapped_column(StrEnumColumn(ExampleEnum))
            ...


        # Use the model - when the value is written to the DB, just "a" will be written
        example = Example(example_column=ExampleEnum.VALUE_A)


    See: https://docs.sqlalchemy.org/en/20/core/custom_types.html#types-typedecorator
    """

    impl = Text

    cache_ok = True

    def __init__(self, lookup_enum: Type[StrEnum], *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.lookup_enum = lookup_enum

    def process_bind_param(self, value: Any | None, dialect: Any) -> str | None:
        """
        Method for converting a StrEnum when writing TO the DB
        """
        if value is None:
            return None

        if not isinstance(value, self.lookup_enum):
            raise Exception(
                f"Cannot convert value of type {type(value)} for binding column, expected {self.lookup_enum}"
            )

        return value  # technically a StrEnum which subclasses str

    def process_result_value(self, value: Any | None, dialect: Any) -> Any | None:
        """
        Method for converting a string in the DB back to the StrEnum
        """
        if value is None:
            return None

        if not isinstance(value, str):
            raise Exception(f"Cannot process value from DB of type {type(value)}")

        # This calls the constructor of the enum (eg. MyEnum(value)) and gives
        # an instance of that enum
        return self.lookup_enum(value)
