"""Direct unit tests for url_utils helpers.

These cover edge cases that the integration-level tests in test_transformation.py
exercise only indirectly — most importantly, inputs that would re-introduce
the fail-hard behavior the module exists to remove (e.g. URLs whose port
component lazily raises ValueError when accessed).
"""

import pytest

from src.services.common_grants.url_utils import redact_url_userinfo, validate_url_compatible


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


class TestRedactUrlUserinfo:

    def test_none_returns_sentinel(self):
        assert redact_url_userinfo(None) == "<none>"

    def test_no_userinfo_returns_input_unchanged(self):
        assert redact_url_userinfo("https://example.com/path") == "https://example.com/path"

    def test_empty_string_returns_input_unchanged(self):
        # urlsplit('') yields no userinfo, no host — must not raise.
        assert redact_url_userinfo("") == ""

    def test_strips_user_and_password(self):
        result = redact_url_userinfo("https://user:secret@host/path")
        assert "user" not in result
        assert "secret" not in result
        assert result == "https://host/path"

    def test_strips_username_only(self):
        result = redact_url_userinfo("https://user@host/path")
        assert "user@" not in result
        assert result == "https://host/path"

    def test_preserves_valid_port_when_stripping_userinfo(self):
        result = redact_url_userinfo("https://user:secret@host:8443/path")
        assert "user" not in result
        assert "secret" not in result
        assert "8443" in result
        assert result == "https://host:8443/path"

    def test_malformed_port_returns_sentinel_not_raise(self):
        """Reviewer-flagged regression guard: SplitResult.port raises ValueError
        on non-numeric ports. If the helper let that propagate, the redact-then-log
        path would crash exactly the way #9904 was crashing — fail-hard on a
        single bad URL string. Must return the sentinel, not raise.
        """
        # No exception:
        result = redact_url_userinfo("https://user:secret@host:abc/path")
        assert result == "<unparseable-url>"
        # And of course no credential leak:
        assert "secret" not in result

    def test_unparseable_returns_sentinel(self):
        # urlsplit is lenient — most "garbage" inputs parse without raising,
        # they just yield empty fields. This test pins the behavior: the helper
        # never raises on string input.
        for garbage in ("", "://", "http:////", "javascript:alert(1)"):
            assert isinstance(redact_url_userinfo(garbage), str)

    def test_caller_never_sees_an_exception(self):
        """End-to-end guard: redact_url_userinfo must be exception-safe for any
        string input. The whole point of this helper is that it sits in the
        logging path of validate_url, where raising would re-create the very
        500 this PR fixes.
        """
        sample_inputs = [
            None,
            "",
            "plain",
            "https://x",
            "https://user:pw@host/path",
            "https://user:pw@host:abc/path",  # malformed port
            "https://user:pw@[::1]:8080/path",  # ipv6
            "ftp://user@host/file",
            "mailto:foo@bar.com",
        ]
        for v in sample_inputs:
            try:
                out = redact_url_userinfo(v)
            except Exception as e:  # pragma: no cover
                pytest.fail(f"redact_url_userinfo raised {e!r} on input {v!r}")
            assert isinstance(out, str)
