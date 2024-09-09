from enum import StrEnum
from typing import Any, Pattern, Type

from marshmallow import ValidationError, validates_schema

from src.api.schemas.extension import MarshmallowErrorContainer, Schema, fields, validators
from src.validation.validation_constants import ValidationErrorType


class BaseSearchSchema(Schema):
    @validates_schema
    def validates_non_empty(self, data: dict, **kwargs: Any) -> None:
        """
        For any search schema, validates that the value provided actually has a filter set.

        For example, a request like:

            {
                "filters": {
                    "my_field": {}
                }
            }

        would be invalid as "my_field" needs at least something within it. Note that providing
        no filters / excluding "my_field" entirely is perfectly fine, we're just trying to avoid
        having something partially filled out to keep the logic downstream a bit simpler.
        """
        if data == {}:
            raise ValidationError(
                [
                    MarshmallowErrorContainer(
                        ValidationErrorType.INVALID, "At least one filter rule must be provided."
                    )
                ]
            )


class BaseSearchSchemaBuilder:
    def __init__(self, schema_class_name: str):
        # The schema class name is used on the endpoint
        self.schema_fields: dict[str, fields.MixinField] = {}
        self.schema_class_name = schema_class_name

    def build(self) -> Schema:
        return BaseSearchSchema.from_dict(self.schema_fields, name=self.schema_class_name)  # type: ignore


class StrSearchSchemaBuilder(BaseSearchSchemaBuilder):
    """
    Builder for setting up a filter in a search endpoint schema.

    Our schemas are setup to look like:

        {
            "filters": {
                "field": {
                    "one_of": ["x", "y", "z"]
                }
            }
        }

    This helps generate the filters for a given field. At the moment,
    only a one_of filter is implemented.

    Usage::

        # In a search request schema, you would use it like so

        class OpportunitySearchFilterSchema(Schema):
            example_enum_field = fields.Nested(
                StrSearchSchemaBuilder("ExampleEnumFieldSchema")
                    .with_one_of(allowed_values=ExampleEnum)
                    .build()
            )

            example_str_field = fields.Nested(
                StrSearchSchemaBuilder("ExampleStrFieldSchema")
                    .with_one_of(example="example_value", minimum_length=5)
                    .build()
            )
    """

    def with_one_of(
        self,
        *,
        allowed_values: Type[StrEnum] | None = None,
        pattern: str | Pattern | None = None,
        example: str | None = None,
        minimum_length: int | None = None
    ) -> "StrSearchSchemaBuilder":
        if pattern is not None and allowed_values is not None:
            raise Exception("Cannot specify both a pattern and allowed_values")

        metadata = {}
        if example:
            metadata["example"] = example

        # We assume it's just a list of strings
        if allowed_values is None:
            params: dict = {"metadata": metadata}

            field_validators: list[validators.Validator] = []
            if minimum_length is not None:
                field_validators.append(validators.Length(min=minimum_length))

            if pattern is not None:
                field_validators.append(validators.Regexp(regex=pattern))

            if len(field_validators) > 0:
                params["validate"] = field_validators

            list_type: fields.MixinField = fields.String(**params)

        # Otherwise it is an enum type which handles allowed values
        else:
            list_type = fields.Enum(allowed_values, metadata=metadata)

        # Note that the list requires at least one value (sending us just [] will raise a validation error)
        self.schema_fields["one_of"] = fields.List(list_type, validate=[validators.Length(min=1)])

        return self


class IntegerSearchSchemaBuilder(BaseSearchSchemaBuilder):
    """
    Builder for setting up a filter in a search endpoint schema for an integer.

    Our schemas are setup to look like:

        {
            "filters": {
                "field": {
                    "min": 1,
                    "max": 5
                }
            }
        }

    This helps generate the filters for a given field. At the moment,
    only a min and max filter are implemented, and can be used to filter
    on a range of values.

    Usage::

        # In a search request schema, you would use it like so

        class OpportunitySearchFilterSchema(Schema):
            example_int_field = fields.Nested(
                IntegerSearchSchemaBuilder("ExampleIntFieldSchema")
                    .with_minimum_value(example=1)
                    .with_maximum_value(example=25)
                    .build()
            )
    """

    def with_minimum_value(
        self, example: int | None = None, positive_only: bool = True
    ) -> "IntegerSearchSchemaBuilder":
        metadata = {}
        if example is not None:
            metadata["example"] = example

        field_validators = []
        if positive_only:
            field_validators.append(validators.Range(min=0))

        self.schema_fields["min"] = fields.Integer(
            allow_none=True, metadata=metadata, validate=field_validators
        )
        return self

    def with_maximum_value(
        self, example: int | None = None, positive_only: bool = True
    ) -> "IntegerSearchSchemaBuilder":
        metadata = {}
        if example is not None:
            metadata["example"] = example

        field_validators = []
        if positive_only:
            field_validators.append(validators.Range(min=0))

        self.schema_fields["max"] = fields.Integer(
            allow_none=True, metadata=metadata, validate=field_validators
        )
        return self


class BoolSearchSchemaBuilder(BaseSearchSchemaBuilder):
    """
    Builder for setting up a filter in a search endpoint schema.

    Our schemas are setup to look like:

        {
            "filters": {
                "field": {
                    "one_of": ["True", "False"]
                }
            }
        }

    This helps generate the filters for a given field. At the moment,
    only a one_of filter is implemented - note that any truthy value
    as determined by Marshmallow is accepted (including "yes", "y", 1 - for true)

    While it doesn't quite make sense to filter by multiple boolean values in most cases,
    we err on the side of consistency with the structure of the query to match other types.

    Usage::

        # In a search request schema, you would use it like so

        class OpportunitySearchFilterSchema(Schema):
            example_bool_field = fields.Nested(
                BoolSearchSchemaBuilder("ExampleBoolFieldSchema")
                    .with_one_of(example=True)
                    .build()
            )
    """

    def with_one_of(self, example: bool | None = None) -> "BoolSearchSchemaBuilder":
        metadata = {}
        if example is not None:
            metadata["example"] = example

        self.schema_fields["one_of"] = fields.List(
            fields.Boolean(metadata=metadata), allow_none=True
        )
        return self


class DateSearchSchemaBuilder(BaseSearchSchemaBuilder):
    """
    Builder for setting up a filter for a range of dates in the search endpoint schema.

    Example of what this might look like:
        {
            "filters": {
                "post_date": {
                    "start_date": "YYYY-MM-DD",
                    "end_date": "YYYY-MM-DD"
                }
            }
        }

    Support for start_date and
    end_date filters have been partially implemented.

    Usage::
    # In a search request schema, you would use it like so:

        example_start_date_field = fields.Nested(
            DateSearchSchemaBuilder("ExampleStartDateFieldSchema")
                .with_start_date()
                .build()
        )

        example_end_date_field = fields.Nested(
            DateSearchSchemaBuilder("ExampleEndDateFieldSchema")
                .with_end_date()
                .build()
        )

        example_startend_date_field = fields.Nested(
            DateSearchSchemaBuilder("ExampleStartEndDateFieldSchema")
                .with_start_date()
                .with_end_date()
                .build()
        )
    """

    def with_start_date(self) -> "DateSearchSchemaBuilder":
        self.schema_fields["start_date"] = fields.Date(allow_none=True)
        return self

    def with_end_date(self) -> "DateSearchSchemaBuilder":
        self.schema_fields["end_date"] = fields.Date(allow_none=True)
        return self
