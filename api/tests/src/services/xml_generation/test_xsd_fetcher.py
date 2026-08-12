"""Tests for XSD dependency discovery and fetching."""

from unittest.mock import Mock, patch

import pytest

from src.services.xml_generation.validation.xsd_fetcher import XSDFetcher, discover_xsd_dependencies

XSD_NS = "http://www.w3.org/2001/XMLSchema"


def _xsd(target_ns: str, deps: list[tuple[str, str]] | None = None) -> bytes:
    """Build a minimal XSD document with optional import/include/redefine deps.

    Args:
        target_ns: targetNamespace for this schema.
        deps: list of (tag, schemaLocation) tuples, e.g. [("import", "b.xsd")].
    """
    dep_elements = ""
    if deps:
        for tag, location in deps:
            dep_elements += f'  <xs:{tag} schemaLocation="{location}"/>\n'

    return f"""<?xml version="1.0"?>
<xs:schema xmlns:xs="{XSD_NS}" targetNamespace="{target_ns}">
{dep_elements}</xs:schema>""".encode()


class TestDiscoverXsdDependencies:
    """Tests for discover_xsd_dependencies()."""

    def test_no_dependencies(self):
        content = _xsd("urn:a")
        deps = discover_xsd_dependencies(content, "https://example.com/a.xsd")
        assert deps == []

    def test_single_import(self):
        content = _xsd("urn:a", deps=[("import", "b.xsd")])
        deps = discover_xsd_dependencies(content, "https://example.com/a.xsd")
        assert deps == ["https://example.com/b.xsd"]

    def test_include_and_redefine(self):
        content = _xsd(
            "urn:a",
            deps=[("include", "b.xsd"), ("redefine", "c.xsd")],
        )
        deps = discover_xsd_dependencies(content, "https://example.com/a.xsd")
        assert deps == [
            "https://example.com/b.xsd",
            "https://example.com/c.xsd",
        ]

    def test_import_without_schema_location_is_skipped(self):
        content = f"""<?xml version="1.0"?>
<xs:schema xmlns:xs="{XSD_NS}" targetNamespace="urn:a">
  <xs:import namespace="urn:b"/>
</xs:schema>""".encode()
        deps = discover_xsd_dependencies(content, "https://example.com/a.xsd")
        assert deps == []

    def test_relative_schema_location_resolved_against_source_url(self):
        content = _xsd("urn:a", deps=[("import", "../shared/b.xsd")])
        deps = discover_xsd_dependencies(content, "https://example.com/forms/a.xsd")
        assert deps == ["https://example.com/shared/b.xsd"]


class TestFetchXsdWithDependencies:
    """Tests for XSDFetcher.fetch_xsd_with_dependencies()."""

    def _mock_get(self, url_to_content: dict[str, bytes]):
        def fake_get(url, timeout=30):
            response = Mock()
            response.content = url_to_content[url]
            response.raise_for_status = Mock()
            return response

        return fake_get

    def test_nested_transitive_imports(self, tmp_path):
        """a imports b, b imports c: fetching a should pull b and c."""
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"
        url_c = "https://example.com/c.xsd"

        content_map = {
            url_a: _xsd("urn:a", deps=[("import", "b.xsd")]),
            url_b: _xsd("urn:b", deps=[("import", "c.xsd")]),
            url_c: _xsd("urn:c"),
        }

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        with patch("requests.get", side_effect=self._mock_get(content_map)):
            result = fetcher.fetch_xsd_with_dependencies(url_a)

        assert set(result["fetched"]) == {url_a, url_b, url_c}
        assert result["errors"] == []
        assert (tmp_path / "a.xsd").exists()
        assert (tmp_path / "b.xsd").exists()
        assert (tmp_path / "c.xsd").exists()

    def test_absolute_schema_location_is_preserved(self, tmp_path):
        content = _xsd("urn:a", deps=[("import", "https://example.com/shared/b.xsd")])
        deps = discover_xsd_dependencies(content, "https://example.com/a.xsd")
        assert deps == ["https://example.com/shared/b.xsd"]

    def test_duplicate_dependency_only_fetched_once(self, tmp_path):
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"

        content_map = {
            url_a: _xsd("urn:a", deps=[("import", "b.xsd"), ("include", "b.xsd")]),
            url_b: _xsd("urn:b"),
        }

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        with patch("requests.get", side_effect=self._mock_get(content_map)) as mock_get:
            result = fetcher.fetch_xsd_with_dependencies(url_a)

        assert set(result["fetched"]) == {url_a, url_b}
        assert mock_get.call_count == 2

    def test_circular_imports_do_not_infinite_loop(self, tmp_path):
        """a imports b, b imports a back: fetch must terminate and fetch both once."""
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"

        content_map = {
            url_a: _xsd("urn:a", deps=[("import", "b.xsd")]),
            url_b: _xsd("urn:b", deps=[("import", "a.xsd")]),
        }

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        fake_get = self._mock_get(content_map)
        with patch("requests.get", side_effect=fake_get) as mock_get:
            result = fetcher.fetch_xsd_with_dependencies(url_a)

        assert set(result["fetched"]) == {url_a, url_b}
        assert result["errors"] == []
        # Each URL should only be downloaded once despite the circular reference.
        assert mock_get.call_count == 2

    def test_already_downloaded_dependency_is_marked_stored(self, tmp_path):
        """If a dependency file already exists on disk, it's reused, not re-downloaded."""
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"

        (tmp_path / "b.xsd").write_bytes(_xsd("urn:b"))

        content_map = {url_a: _xsd("urn:a", deps=[("import", "b.xsd")])}

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        with patch("requests.get", side_effect=self._mock_get(content_map)) as mock_get:
            result = fetcher.fetch_xsd_with_dependencies(url_a)

        assert result["fetched"] == [url_a]
        assert result["stored"] == [url_b]
        mock_get.assert_called_once_with(url_a, timeout=30)

    def test_fetch_error_on_dependency_is_recorded_not_raised(self, tmp_path):
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"

        def fake_get(url, timeout=30):
            if url == url_a:
                response = Mock()
                response.content = _xsd("urn:a", deps=[("import", "b.xsd")])
                response.raise_for_status = Mock()
                return response
            raise ConnectionError("boom")

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        with patch("requests.get", side_effect=fake_get):
            result = fetcher.fetch_xsd_with_dependencies(url_a)

        assert result["fetched"] == [url_a]
        assert len(result["errors"]) == 1
        assert result["errors"][0]["url"] == url_b

    def test_fetch_all_collapses_shared_dependencies_across_top_level_urls(self, tmp_path):
        """Two top-level forms sharing a common dependency should only fetch it once."""
        url_a = "https://example.com/a.xsd"
        url_b = "https://example.com/b.xsd"
        url_shared = "https://example.com/shared.xsd"

        content_map = {
            url_a: _xsd("urn:a", deps=[("import", "shared.xsd")]),
            url_b: _xsd("urn:b", deps=[("import", "shared.xsd")]),
            url_shared: _xsd("urn:shared"),
        }

        fetcher = XSDFetcher(xsd_dir=tmp_path)
        with patch("requests.get", side_effect=self._mock_get(content_map)) as mock_get:
            result = fetcher.fetch_all([url_a, url_b])

        assert set(result["fetched"]) == {url_a, url_b, url_shared}
        assert mock_get.call_count == 3
