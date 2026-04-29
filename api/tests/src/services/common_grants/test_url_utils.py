"""Direct unit tests for url_utils helpers."""

import pytest
from marshmallow import ValidationError as MarshmallowValidationError
from marshmallow import fields as marshmallow_fields
from pydantic import BaseModel, Field, HttpUrl

from src.services.common_grants.url_utils import validate_url_compatible


class _PydanticHttpUrl(BaseModel):
    """Minimal pydantic HttpUrl validator used to demonstrate the divergence."""

    url: HttpUrl = Field(strict=True)


class TestValidateUrlCompatible:
    def test_returns_none_for_none(self):
        assert validate_url_compatible(None) is None

    def test_returns_none_for_empty_string(self):
        assert validate_url_compatible("") is None

    def test_normalizes_valid_url(self):
        assert validate_url_compatible("https://example.com") == "https://example.com/"

    def test_rejects_comma_separated_urls(self):
        # Pydantic accepts (mangled), marshmallow rejects → must return None.
        assert validate_url_compatible("https://a.gov,https://b.gov") is None

    def test_rejects_scheme_only_host(self):
        # Pydantic accepts TLD-less hosts, marshmallow rejects.
        assert validate_url_compatible("http://example") is None

    def test_rejects_garbage(self):
        assert validate_url_compatible("not-a-url") is None
        assert validate_url_compatible("sam.gov") is None  # missing scheme

    @pytest.mark.parametrize(
        "bad_url",
        [
            "https://a.gov,https://b.gov",  # comma-URL: agencies pasting multiple links
            "http://example",  # scheme-only-host: TLD-less hostname
        ],
    )
    def test_recreation_pydantic_accepts_marshmallow_rejects(self, bad_url):
        """Pin the bug condition: each URL passes pydantic's HttpUrl alone AND
        fails marshmallow's fields.URL alone. validate_url_compatible drops it
        because the dual-check requires both. Without the fix, the URL would
        land in the response and 500 the marshmallow load on the way out (this
        is what the prod New Relic 'Not a valid URL.' trace was hitting).
        """
        # Pydantic alone accepts.
        normalized = str(_PydanticHttpUrl(url=bad_url).url)
        assert normalized

        # Marshmallow alone rejects with the exact prod error message.
        with pytest.raises(MarshmallowValidationError) as exc:
            marshmallow_fields.URL().deserialize(normalized)
        assert "Not a valid URL." in str(exc.value)

        # The fix: dual-check returns None.
        assert validate_url_compatible(bad_url) is None
