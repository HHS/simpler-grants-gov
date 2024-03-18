from typing import Any, cast

import apiflask
from marshmallow import EXCLUDE

from src.api.schemas.extension.schema_common import MarshmallowErrorContainer
from src.validation.validation_constants import ValidationErrorType


class Schema(apiflask.Schema):
    # There's no clean way to override the error messages at the schema-level
    # as they get stored directly into the internal error store of the Schema object
    #
    # This approach is a little hacky, but we just change the default error messages to
    # return the error container objects directly to work around that
    _default_error_messages = cast(
        dict[str, str],
        {
            "type": MarshmallowErrorContainer(
                key=ValidationErrorType.INVALID, message="Invalid input type."
            ),
            "unknown": MarshmallowErrorContainer(
                key=ValidationErrorType.UNKNOWN, message="Unknown field."
            ),
        },
    )

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)

        # In order for the OpenAPI docs to display correctly
        # we need to set sub-schemas as partial=True, as the
        # apispec library doesn't handle recursively passing that down
        # like it should through nested/list objects.
        if self.partial is True:
            for field in self.declared_fields.values():
                # If the field has nested, then it's a
                # Nested field object
                if hasattr(field, "nested"):
                    field.nested.partial = True

                # If the field has inner, then it's a list
                # which has a nested schema within it
                if hasattr(field, "inner"):
                    if hasattr(field.inner, "nested"):
                        field.inner.nested.partial = True

    class Meta:
        # Ignore any extra fields
        unknown = EXCLUDE
