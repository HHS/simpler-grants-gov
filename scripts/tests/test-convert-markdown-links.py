# tests/test_convert_markdown_links.py
"""Tests for convert-markdown-links.py script."""

import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock
import tempfile
import os
import importlib.util

spec = importlib.util.spec_from_file_location(
    "convert_markdown_links",
    Path(__file__).parent.parent / "utilities" / "convert-markdown-links.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

is_external_url = module.is_external_url
split_url_and_title = module.split_url_and_title
split_path_and_anchor = module.split_path_and_anchor
mask_inline_code = module.mask_inline_code
rewrite_target = module.rewrite_target
process_file = module.process_file


class TestIsExternalUrl:
    """Test external URL detection."""
    
    def test_http_url(self):
        assert is_external_url("http://example.com")
    
    def test_https_url(self):
        assert is_external_url("https://example.com")
    
    def test_protocol_with_plus(self):
        assert is_external_url("svn+ssh://example.com")
    
    def test_protocol_with_dash(self):
        assert is_external_url("git-ssh://example.com")
    
    def test_protocol_case_insensitive(self):
        assert is_external_url("HTTP://example.com")
        assert is_external_url("HTTPS://example.com")
    
    def test_double_slash(self):
        assert is_external_url("//example.com")
    
    def test_relative_path(self):
        assert not is_external_url("../docs/file.md")
    
    def test_anchor_only(self):
        assert not is_external_url("#section")
    
    def test_absolute_path(self):
        assert not is_external_url("/docs/file.md")


class TestSplitUrlAndTitle:
    """Test URL and title splitting."""
    
    def test_url_only(self):
        url, title = split_url_and_title("../docs/file.md")
        assert url == "../docs/file.md"
        assert title == ""
    
    def test_url_with_title(self):
        url, title = split_url_and_title("../docs/file.md \"My Title\"")
        assert url == "../docs/file.md"
        assert title == " \"My Title\""
    
    def test_url_with_space_and_title(self):
        url, title = split_url_and_title("../docs/file.md  'Alt Text'")
        assert url == "../docs/file.md"
        assert title == "  'Alt Text'"
    
    def test_angle_bracketed_url(self):
        url, title = split_url_and_title("<../docs/file.md>")
        assert url == ""
        assert title == ""
    
    def test_angle_bracketed_with_spaces(self):
        url, title = split_url_and_title("  <../docs/file.md>")
        assert url == ""
        assert title == ""


class TestSplitPathAndAnchor:
    """Test path and anchor/query splitting."""
    
    def test_path_only(self):
        path, suffix = split_path_and_anchor("../docs/file.md")
        assert path == "../docs/file.md"
        assert suffix == ""
    
    def test_path_with_anchor(self):
        path, suffix = split_path_and_anchor("../docs/file.md#section")
        assert path == "../docs/file.md"
        assert suffix == "#section"
    
    def test_path_with_query(self):
        path, suffix = split_path_and_anchor("../docs/file.md?param=value")
        assert path == "../docs/file.md"
        assert suffix == "?param=value"
    
    def test_path_with_anchor_and_query(self):
        path, suffix = split_path_and_anchor("../docs/file.md#section?param=value")
        assert path == "../docs/file.md"
        assert suffix == "#section?param=value"
    
    def test_anchor_only(self):
        path, suffix = split_path_and_anchor("#section")
        assert path == ""
        assert suffix == "#section"
    
    def test_query_only(self):
        path, suffix = split_path_and_anchor("?param=value")
        assert path == ""
        assert suffix == "?param=value"


class TestMaskInlineCode:
    """Test inline code masking."""
    
    def test_no_backticks(self):
        result = mask_inline_code("This is plain text")
        assert result == "This is plain text"
    
    def test_single_backtick_pair(self):
        result = mask_inline_code("This is `code` here")
        assert result == "This is \x00\x00\x00\x00\x00\x00 here"
    
    def test_multiple_backtick_pairs(self):
        result = mask_inline_code("Use `foo` and `bar` functions")
        assert "\x00" in result
        assert "foo" not in result
        assert "bar" not in result
    
    def test_double_backticks(self):
        result = mask_inline_code("Use ``foo`` for emphasis")
        assert "foo" not in result
    
    def test_link_with_backticks(self):
        result = mask_inline_code("[`code`](../file.md)")
        assert "code" not in result
        assert "../file.md" in result


class TestRewriteTarget:
    """Test URL rewriting logic."""
    
    def test_anchor_only_unchanged(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "#section")
        assert new_url == "#section"
        assert status == "unchanged"
        assert reason == "anchor-only or query-only"
    
    def test_external_url_unchanged(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "https://example.com")
        assert new_url == "https://example.com"
        assert status == "unchanged"
    
    def test_absolute_path_unchanged(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "/docs/other.md")
        assert new_url == "/docs/other.md"
        assert status == "unchanged"
    
    def test_relative_path_rewritten(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "other.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        target.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "other.md")
        assert new_url == "/docs/other.md"
        assert status == "rewritten"
    
    def test_parent_directory_reference(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "api" / "file.md"
        target = repo_root / "docs" / "other.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        target.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "../other.md")
        assert new_url == "/docs/other.md"
        assert status == "rewritten"
    
    def test_nonexistent_file_unable_to_validate(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "nonexistent.md")
        assert status == "unable to validate"
        assert reason == "target does not exist"
    
    def test_path_outside_repo_root(self, tmp_path):
        repo_root = tmp_path / "repo"
        repo_root.mkdir()
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "../../outside.md")
        assert status == "unable to validate"
        assert reason == "resolves outside repo root"
    
    def test_preserves_trailing_slash(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "dir" / "index.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.parent.mkdir(parents=True, exist_ok=True)
        source.write_text("test")
        target.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "dir/")
        assert new_url.endswith("/")
        assert status == "rewritten"
    
    def test_percent_encoded_characters_preserved(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "file (1).md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "file%20(1).md")
        assert new_url == "/docs/file%20(1).md" 
        assert status == "rewritten"
    
    def test_preserves_anchor_suffix(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "other.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "other.md#section")
        assert new_url == "/docs/other.md#section"
        assert status == "rewritten"

    def test_non_ascii_characters_encoded(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "café.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "café.md")
        assert new_url == "/docs/café.md"
        assert status == "rewritten"

    def test_parentheses_encoded(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "file(1).md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "file(1).md")
        assert new_url == "/docs/file(1).md" 
        assert status == "rewritten"

    def test_forward_slashes_not_encoded(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "api" / "reference.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "api/reference.md")
        assert new_url == "/docs/api/reference.md"
        assert "%2F" not in new_url  # Forward slash should NOT be encoded
        assert status == "rewritten"

    def test_already_encoded_not_double_encoded(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "file%20name.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        new_url, status, reason = rewrite_target(repo_root, source, "file%20name.md")
        assert new_url == "/docs/file%20name.md"
        assert "%2520" not in new_url  # Should NOT be double-encoded
        assert status == "rewritten"

    def test_decoded_filename_with_space(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "file name.md"  # Actual file with space
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        source.write_text("test")
        
        # Input file%20name.md should find the file with actual space
        new_url, status, reason = rewrite_target(repo_root, source, "file%20name.md")
        assert new_url == "/docs/file%20name.md"
        assert status == "rewritten"
    
class TestProcessFile:
    """Test full file processing."""
    
    def test_simple_markdown_link(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "other.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("test")
        
        content = "Check [this](other.md) out"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert "[this](/docs/other.md)" in new_content
        assert len(rows) == 1
        assert rows[0]["status"] == "rewritten"
    
    def test_image_link(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target = repo_root / "docs" / "image.png"
        source.parent.mkdir(parents=True, exist_ok=True)
        target.write_text("fake image")
        
        content = "![alt](image.png)"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert "![alt](/docs/image.png)" in new_content
    
    def test_fenced_code_block_ignored(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        
        content = "```\n[link](other.md)\n```"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert new_content == content
        assert len(rows) == 0
    
    def test_inline_backticks_ignored(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        
        content = "Use `[link](other.md)` in code"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert "[link](other.md)" in new_content
        assert len(rows) == 0
    
    def test_external_link_unchanged(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        
        content = "Check [external](https://example.com)"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert new_content == content
        assert len(rows) == 0
    
    def test_multiple_links_in_file(self, tmp_path):
        repo_root = tmp_path
        source = repo_root / "docs" / "file.md"
        target1 = repo_root / "docs" / "other.md"
        target2 = repo_root / "docs" / "another.md"
        source.parent.mkdir(parents=True, exist_ok=True)
        target1.write_text("test")
        target2.write_text("test")
        
        content = "Check [link1](other.md) and [link2](another.md)"
        source.write_text(content)
        
        new_content, rows = process_file(repo_root, source)
        assert "[link1](/docs/other.md)" in new_content
        assert "[link2](/docs/another.md)" in new_content
        assert len(rows) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
