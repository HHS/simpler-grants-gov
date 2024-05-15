import copy
import enum
import typing
import uuid

from apiflask import fields as original_fields
from marshmallow import ValidationError

from src.api.schemas.extension.field_validators import Range
from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.validation.validation_constants import ValidationErrorType


class MixinField(original_fields.Field):
    """
    Field mixin class to override the make_error method on each of
    our field classes defined below.

    Note that in Python when a class inherits from multiple classes,
    the left-most one takes precedence, so if any subclass of Field
    were to modify the make_error method, that should take precedence
    over this one.

    As make_error is only defined once in the Field class, this is fine
    """

    # Any derived class can specify an error_mapping object
    # and it will be used / override the defaults here
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "required": MarshmallowErrorContainer(
            ValidationErrorType.REQUIRED, "Missing data for required field."
        ),
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Invalid value."),
        "null": MarshmallowErrorContainer(ValidationErrorType.NOT_NULL, "Field may not be null."),
        # not sure when this one gets hit, a failed validator uses the validator message
        "validator_failed": MarshmallowErrorContainer(
            ValidationErrorType.INVALID, "Invalid value."
        ),
    }

    def __init__(self, **kwargs: typing.Any) -> None:
        # TODO - this was needed to process the response from OpenSearch
        # without configuring a bunch of fields - we might want to consider
        # this in some way? I feel like allowing none by default should be the
        # behavior, or at least if the field is not required.
        super().__init__(allow_none=True, **kwargs)

        # The actual error mapping used for a specific instance
        self._error_mapping: dict[str, MarshmallowErrorContainer] = {}

        # This iterates over all classes and updates the error
        # mapping with the most-specific class values overriding
        # the most generic.
        for cls in reversed(self.__class__.__mro__):
            # Copy the error mapping values so any alterations don't
            # affect other class objects
            configured_error_mapping = getattr(cls, "error_mapping", {})
            for k, v in configured_error_mapping.items():
                self._error_mapping[k] = copy.copy(v)

    def make_error(self, key: str, **kwargs: typing.Any) -> ValidationError:
        """Helper method to make a `ValidationError` with an error message
        from ``self.error_mapping``.
        """
        try:
            error_container = self._error_mapping[key]
        except KeyError as error:
            class_name = self.__class__.__name__
            message = (
                "ValidationError raised by `{class_name}`, but error key `{key}` does "
                "not exist in the `error_mapping` dictionary."
            ).format(class_name=class_name, key=key)
            raise AssertionError(message) from error

        if kwargs:
            error_container.message = error_container.message.format(**kwargs)

        return ValidationError([error_container])


class String(original_fields.String, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid string."),
        "invalid_utf8": MarshmallowErrorContainer(
            ValidationErrorType.INVALID, "Not a valid utf-8 string."
        ),
    }


class Integer(original_fields.Integer, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid integer."),
    }

    def __init__(self, restrict_to_32bit_int: bool = False, **kwargs: typing.Any):
        # By default, we'll restrict all integer values to 32-bits so that they can be stored in
        # Postgres' integer column. If you wish to process a larger value, simply set this to false or specify
        # your own min/max Range.
        if restrict_to_32bit_int:
            validators = kwargs.get("validate", [])

            # If a different range is specified, skip adding this one to avoid duplicate error messages
            has_range_validator = False
            for validator in validators:
                if isinstance(validator, Range):
                    has_range_validator = True
                    break

            if not has_range_validator:
                validators.append(Range(-2147483648, 2147483647))
                kwargs["validate"] = validators

        super().__init__(**kwargs)


class Boolean(original_fields.Boolean, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid boolean."),
    }


class Decimal(original_fields.Decimal, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid decimal."),
        "special": MarshmallowErrorContainer(
            ValidationErrorType.SPECIAL_NUMERIC,
            "Special numeric values (nan or infinity) are not permitted.",
        ),
    }


class UUID(original_fields.UUID, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid UUID."),
        "invalid_uuid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid UUID."),
    }

    def __init__(self, **kwargs: typing.Any):
        super().__init__(**kwargs)
        self.metadata["example"] = uuid.uuid4()


class Date(original_fields.Date, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid date."),
        "format": MarshmallowErrorContainer(
            ValidationErrorType.FORMAT, "'{input}' cannot be formatted as a date."
        ),
    }


class DateTime(original_fields.DateTime, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid datetime."),
        "invalid_awareness": MarshmallowErrorContainer(
            ValidationErrorType.INVALID, "Not a valid datetime."
        ),
        "format": MarshmallowErrorContainer(
            ValidationErrorType.FORMAT, "'{input}' cannot be formatted as a datetime."
        ),
    }


class List(original_fields.List, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "invalid": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid list."),
    }


class Nested(original_fields.Nested, MixinField):
    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "type": MarshmallowErrorContainer(ValidationErrorType.INVALID, "Invalid type."),
    }

    def __init__(self, nested: typing.Any, **kwargs: typing.Any):
        super().__init__(nested=nested, **kwargs)
        # We set this to object so that if it's nullable, it'll
        # get generated in the OpenAPI to allow nullable
        type_values = ["object"]
        if self.allow_none:
            type_values.append("null")
        self.metadata["type"] = type_values


class Raw(original_fields.Raw, MixinField):
    # No error mapping changed from the default
    pass


class Enum(MixinField):
    """
    Custom field class for handling unioning together multiple Python enums into
    a single enum field in the generated openapi schema.

    For example, if you have an enum with values x, y, z, and another enum with values a, b, c
    using this class all 6 of these values would be possible, and when the value
    is deserialized, we would properly convert it to the proper enum object
    """

    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "unknown": MarshmallowErrorContainer(
            ValidationErrorType.INVALID_CHOICE, "Must be one of: {choices}."
        ),
    }

    def __init__(self, *enums: typing.Type[enum.Enum], **kwargs: typing.Any) -> None:
        super().__init__(**kwargs)

        self.enums = enums
        self.field = original_fields.Field()

        self.enum_mapping = {}

        possible_choices = []
        for e in self.enums:
            for raw_enum_value in e:
                enum_value = str(self.field._serialize(raw_enum_value.value, None, None))
                possible_choices.append(enum_value)
                self.enum_mapping[enum_value] = e

        self.choices_text = ", ".join(possible_choices)
        # Set the enum metadata
        self.metadata["enum"] = possible_choices
        # Set the type so Swagger will know it's an enum-string
        if self.metadata.get("type") is None:
            type_values = ["string"]
            if self.allow_none:
                type_values.append("null")
            self.metadata["type"] = type_values

    def _serialize(
        self, value: typing.Any, attr: str | None, obj: typing.Any, **kwargs: typing.Any
    ) -> typing.Any:
        if value is None:
            return None

        val = value.value
        return self.field._serialize(val, attr, obj, **kwargs)

    def _deserialize(
        self,
        value: typing.Any,
        attr: str | None,
        data: typing.Mapping[str, typing.Any] | None,
        **kwargs: typing.Any,
    ) -> typing.Any:
        val = self.field._deserialize(value, attr, data, **kwargs)

        enum_type = self.enum_mapping.get(val)
        if not enum_type:
            raise self.make_error("unknown", choices=self.choices_text)

        return enum_type(val)
