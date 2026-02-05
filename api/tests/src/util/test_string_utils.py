import pytest

from src.util.string_utils import is_valid_uuid, join_list, truncate_html_safe


def test_join_list():
    assert join_list(None) == ""
    assert join_list(None, ",") == ""
    assert join_list(None, "|") == ""
    assert join_list([]) == ""
    assert join_list([], ",") == ""
    assert join_list([], "|") == ""

    assert join_list(["a", "b", "c"]) == "a\nb\nc"
    assert join_list(["a", "b", "c"], ",") == "a,b,c"
    assert join_list(["a", "b", "c"], "|") == "a|b|c"


@pytest.mark.parametrize(
    "value,is_valid",
    [
        ("20f5484b-88ae-49b0-8af0-3a389b4917dd", True),
        ("abc123", False),
        ("1234", False),
        ("xyz", False),
    ],
)
def test_is_valid_uuid(value, is_valid):
    assert is_valid_uuid(value) is is_valid


@pytest.mark.parametrize(
    "html_str,expected_html",
    [
        # Truncate mid-text inside inline tag <strong>, no closing tag present
        (
            "<p>This is a <strong>very big description, here!!!!",
            "<p>This is a <strong>very big description, here!!!</strong>",
        ),
        # Truncate mid-text inside multiple nested inline tags
        (
            "<p>Some <strong>bold and <em>emphasized text here EXTRA WORDS</p>",
            "<p>Some <strong>bold and <em>emphasized text here </em></strong>",
        ),
        # Truncate inside deeply nested block tags (block tags intentionally left open)
        (
            "<div>first<div>second<div>third and some extra trailing content</div></div></div>",
            "<div>first<div>second<div>third and some extra tra",
        ),
        # Broken / mismatched HTML, truncate after inline content
        (
            "<p>Hello <p><strong>i am here!!!</strong></div></p> EXTRA TEXT",
            "<p>Hello <p><strong>i am here!!!</strong>",
        ),
        # Self-closing tag inside truncated text (e.g. <br />)
        (
            "<div>This is a description<br/>with a break tag and more words here</div>",
            "<div>This is a description<br/>with a break tag an",
        ),
        # Deep nesting with inline tags, truncate mid-inline
        (
            "<section><div><p>This is <span>a deeply <strong>nested example with text",
            "<section><div><p>This is <span>a deeply <strong>ne</strong></span>",
        ),
    ],
)
def test_truncate_html_safe(
    html_str,
    expected_html,
):

    res = truncate_html_safe(html_str, 50)
    assert res == expected_html
