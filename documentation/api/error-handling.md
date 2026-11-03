# Overview

When an error occurs in an API endpoint, we want to return something formatted like:

```json
{
  "data": {},
  "errors": [
    {
      "field": "path.to.field_name",
      "message": "field is required",
      "type": "required",
      "value": null
    }
  ],
  "message": "There was a validation error",
  "status_code": 422
}
```

This structure allows users of the API the ability to determine what the error was
and for which field in the request programatically. While not every error will
specify a field, by having a consistent structure users are able to reliably
implement error handling.

However, the various libraries we use don't structure errors this way, and so
we have several pieces of code to handle making everything fit together nicely.

APIFlask supports providing your own [error processor](https://apiflask.com/error-handling/)
which we have implemented in [restructure_error_response](../../api/src/api/response.py)

# Error Handling

## Throwing an exception

When an exception is thrown during an API call, this will result in a 500 error
unless it is an exception that APIFlask has configured to return a different status code
like the ones from the `werkzeug` library. However, if you throw one of these
exceptions, any message or other information is lost. To avoid this, instead
use our `raise_flask_error` function which handles wrapping exceptions in
a format that APIFlask will keep the context we add.

```py
from src.api.response import ValidationErrorDetail
from src.api.route_utils import raise_flask_error
from src.validation.validation_constants import ValidationErrorType


from werkzeug.exceptions import NotFound


raise_flask_error(NotFound.code, "Unable to find the record requested", validation_issues=[ValidationErrorDetail(message="could not find", type=ValidationErrorType.UNKNOWN)])
```

This would result in an error that looks like:
```json
{
  "data": {},
  "errors": [
    {
      "field": null,
      "message": "could not find",
      "type": "unknown"
    }
  ],
  "message": "Unable to find the record requested",
  "status_code": 404
}
```

Note that the validation error detail list is optional, and generally only used
for validation errors.

## Marshmallow Errors

By default, Marshmallow constructs its errors like:
```json
{
  "path": {
    "to": {
      "field": ["error message1", "error message2"]
    }
  }
}
```

There are two issues with this, the path structure, and error message. Fixing the path
structure is simple and just requires flattening the dictionary, but the error messages
unfortunately only provide a message, when we want a message AND code for the particular error.

To work around this challenge, we created our own derived versions of the Marshmallow schema,
field, and validator classes in the [extensions folder](../../api/src/api/schemas/extension).

These extend the Marshmallow classes to instead output their errors as a [MarshmallowErrorContainer](../../api/src/api/schemas/extension/schema_common.py)

This is done by modifying the default error message that each validation rule has to instead
be a `MarshmallowErrorContainer` object. For most of the fields, this is just a bit of configuration,
but the validators required re-implementing them as they handled errors directly in validation.

When Marshmallow throws its errors, our [process_marshmallow_issues](../../api/src/api/response.py) function
will get called which handles flattening the errors, and then restructuring them into
proper format.
