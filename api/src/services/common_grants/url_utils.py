"""URL validation shared across CG transformation and CG custom-field validators.

Pydantic's HttpUrl and marshmallow's fields.URL disagree on a handful of inputs
(comma-separated URLs, scheme-only-host like "http://example", etc.). Pydantic
accepts and normalizes; marshmallow rejects. Because the CG response is loaded
through marshmallow on the way out, any URL accepted by pydantic but rejected
by marshmallow blows up the entire batch with a 500 (issue #9904). This module
exposes a single helper that requires both validators to accept, so divergent
strings are dropped at the source.
"""

from urllib.parse import urlsplit, urlunsplit

from marshmallow import ValidationError as MarshmallowValidationError
from marshmallow import fields as marshmallow_fields
from pydantic import BaseModel, Field, HttpUrl, ValidationError


class _UrlValidator(BaseModel):
    """Pydantic strict HttpUrl validator."""

    url: HttpUrl = Field(strict=True)


_marshmallow_url_field = marshmallow_fields.URL()


def validate_url_compatible(value: str | None) -> str | None:
    """Return the normalized URL if accepted by *both* pydantic HttpUrl and
    marshmallow's fields.URL; otherwise None.

    The CG response is loaded through marshmallow on the way out, so a URL
    accepted only by pydantic blows up the entire batch (issue #9904).
    Returning the pydantic-normalized form means downstream callers see a
    consistent string and that exact string is what the response load
    re-validates.
    """
    if value is None or value == "":
        return None
    try:
        valid = _UrlValidator.model_validate({"url": value})
        normalized = str(valid.url)
        _marshmallow_url_field.deserialize(normalized)
        return normalized
    except (ValidationError, MarshmallowValidationError):
        return None


def redact_url_userinfo(value: str | None) -> str:
    """Strip ``user:password@`` from a URL before logging.

    Grants.gov data occasionally puts free text or markdown into URL fields.
    If a record contains ``https://user:secret@host/path`` (intentional or
    accidental), the raw string flows through pydantic and lands in
    validation-failure logs verbatim — leaking the credentials to log
    aggregation. Strip userinfo here. Falls back to a fixed sentinel if the
    URL is unparseable so the caller always has something logger-safe.
    """
    if value is None:
        return "<none>"
    try:
        parts = urlsplit(value)
    except ValueError:
        return "<unparseable-url>"
    if not parts.username and not parts.password:
        return value
    host = parts.hostname or ""
    if parts.port:
        host = f"{host}:{parts.port}"
    return urlunsplit((parts.scheme, host, parts.path, parts.query, parts.fragment))
