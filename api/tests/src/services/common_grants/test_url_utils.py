"""Direct unit tests for url_utils helpers."""

from src.services.common_grants.url_utils import validate_url_compatible


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
