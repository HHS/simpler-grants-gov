import copy
import typing

from apiflask import validators
from marshmallow import ValidationError
from marshmallow.validate import _SizedT
from werkzeug.datastructures import FileStorage

from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.validation.validation_constants import ValidationErrorType

Validator = validators.Validator  # re-export


class FileSize(Validator):
    """Validator which succeeds if the file size is within the specified limits."""

    def __init__(self, max_size_bytes: int, error: str | None = None):
        self.max_size_bytes = max_size_bytes
        self.max_size_mb = max_size_bytes / (1024 * 1024)
        self.error: str = error or "File size must be less than {max_size_mb:.1f} MB"

    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "message": MarshmallowErrorContainer(
            ValidationErrorType.MAX_VALUE, "File size must be less than {max_size_mb:.1f} MB"
        ),
    }

    def _make_error(self) -> ValidationError:
        error_container = copy.copy(self.error_mapping["message"])
        error_container.message = self.error.format(
            max_size_bytes=self.max_size_bytes, max_size_mb=self.max_size_mb
        )
        return ValidationError([error_container])

    def __call__(self, value: FileStorage) -> FileStorage:
        # Check if the value has the required attributes for file validation
        if not hasattr(value, "content_length") or not hasattr(value, "filename"):
            raise ValidationError(
                [MarshmallowErrorContainer(ValidationErrorType.INVALID, "Not a valid file.")]
            )

        # Check if the file has content length set
        if value.content_length is not None:
            if value.content_length > self.max_size_bytes:
                raise self._make_error()

        return value


class Regexp(validators.Regexp):
    REGEX_ERROR = MarshmallowErrorContainer(
        ValidationErrorType.FORMAT, "String does not match expected pattern."
    )

    @typing.overload
    def __call__(self, value: str) -> str: ...

    @typing.overload
    def __call__(self, value: bytes) -> bytes: ...

    def __call__(self, value: str | bytes) -> str | bytes:
        if self.regex.match(value) is None:  # type: ignore
            raise ValidationError([self.REGEX_ERROR])

        return value


class Length(validators.Length):
    """Validator which succeeds if the value passed to it has a
    length between a minimum and maximum. Uses len(), so it
    can work for strings, lists, or anything with length.

    :param min: The minimum length. If not provided, minimum length
        will not be checked.
    :param max: The maximum length. If not provided, maximum length
        will not be checked.
    :param equal: The exact length. If provided, maximum and minimum
        length will not be checked.
    :param error: Error message to raise in case of a validation error.
        Can be interpolated with `{input}`, `{min}` and `{max}`.
    """

    error_mapping: dict[str, MarshmallowErrorContainer] = {
        "message_min": MarshmallowErrorContainer(
            ValidationErrorType.MIN_LENGTH, "Shorter than minimum length {min}."
        ),
        "message_max": MarshmallowErrorContainer(
            ValidationErrorType.MAX_LENGTH, "Longer than maximum length {max}."
        ),
        "message_all": MarshmallowErrorContainer(
            ValidationErrorType.MIN_OR_MAX_LENGTH, "Length must be between {min} and {max}."
        ),
        "message_equal": MarshmallowErrorContainer(
            ValidationErrorType.EQUALS, "Length must be {equal}."
        ),
    }

    def _make_error(self, key: str) -> ValidationError:
        try:
            # Make a copy of the error mapping so we aren't modifying
            # the class-level configurations above when we do formatting
            error_container = copy.copy(self.error_mapping[key])
        except KeyError as error:
            class_name = self.__class__.__name__
            message = (
                "ValidationError raised by `{class_name}`, but error key `{key}` does "
                "not exist in the `error_messages` dictionary."
            ).format(class_name=class_name, key=key)
            raise AssertionError(message) from error

        error_container.message = error_container.message.format(
            min=self.min, max=self.max, equal=self.equal
        )

        return ValidationError([error_container])

    def __call__(self, value: _SizedT) -> _SizedT:
        length = len(value)

        if self.equal is not None:
            if length != self.equal:
                raise self._make_error("message_equal")
            return value

        if self.min is not None and length < self.min:
            key = "message_min" if self.max is None else "message_all"
            raise self._make_error(key)

        if self.max is not None and length > self.max:
            key = "message_max" if self.min is None else "message_all"
            raise self._make_error(key)

        return value


class Email(validators.Email):
    EMAIL_ERROR = MarshmallowErrorContainer(
        ValidationErrorType.FORMAT, "Not a valid email address."
    )

    def __call__(self, value: str) -> str:
        try:
            return super().__call__(value)
        except ValidationError:
            # Fix the validation error to have our format
            raise ValidationError([self.EMAIL_ERROR]) from None


class OneOf(validators.OneOf):
    """
    Validator which succeeds if ``value`` is a member of ``choices``.

    Use this when you want to limit the choices, but don't need the value to be an enum
    """

    CONTAINS_ONLY_ERROR = MarshmallowErrorContainer(
        ValidationErrorType.INVALID_CHOICE, "Value must be one of: {choices_text}"
    )

    def __call__(self, value: typing.Any) -> typing.Any:
        if value not in self.choices:
            error_container = copy.copy(self.CONTAINS_ONLY_ERROR)
            error_container.message = error_container.message.format(choices_text=self.choices_text)
            raise ValidationError([error_container])

        return value


_T = typing.TypeVar("_T")


class Range(validators.Range):
    def _format_error(self, value: _T, message: str) -> list[MarshmallowErrorContainer]:  # type: ignore
        # The method this overrides returns a string, but we'll modify it to return one of
        # our error containers instead which works, but MyPy doesn't like.

        is_min = False
        is_max = False
        if self.min is not None or self.max_inclusive is not None:
            is_min = True
        if self.max is not None or self.max_inclusive is not None:
            is_max = True

        if is_min and is_max:
            error_type = ValidationErrorType.MIN_OR_MAX_VALUE
        elif is_min:
            error_type = ValidationErrorType.MIN_VALUE
        else:  # must be max, init requires you set something
            error_type = ValidationErrorType.MAX_VALUE

        return [MarshmallowErrorContainer(error_type, super()._format_error(value, message))]
