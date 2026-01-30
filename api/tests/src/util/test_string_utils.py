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
        ("abc123", False),
    ],
)
def test_is_valid_uuid(value, is_valid):
    assert is_valid_uuid(value) is is_valid


@pytest.mark.parametrize(
    "html_str,expected_html",
    [
        # Truncate mid-text inside inline tag <strong>, no closing tags
        (
            "<p>This is a <strong>very big description here!!!!",
            "<p>This is a <strong>very big description here!!!!</strong>",
        ),
        # Truncate mid-text inside multiple inline tag
        (
            "<p>Some <strong>bold and <em>emphasized text here ",
            "<p>Some <strong>bold and <em>emphasized text here </em></strong>",
        ),
        (
            "div>first<div>second<div>another</div></div></div>",
            "div>first<div>second<div>another",
        ),
        (
            "<p>Hello <p><strong>i am here!!</strong></div></p>",
            "<p>Hello <p><strong>i am here!!</strong>",
        ),
        # Truncate after closing an inline tag
        (
            "<p>This is a <strong>very long text that </strong>",
            "<p>This is a <strong>very long text that </strong>",
        ),
        # Truncate mid-text after closing an inline tag
        (
            "<p>This is a <strong>very long text</strong> that ",
            "<p>This is a <strong>very long text</strong> that ",
        ),
        # Self-closing tag inside truncated text (e.g. <br />)
        (
            "<div>This is a description<br/>with a break tag an",
            "<div>This is a description<br/>with a break tag an",
        ),
        # Deeply nested HTML tags
        (
            "<section><div><p>This is <span>a deeply <strong>ne",
            "<section><div><p>This is <span>a deeply <strong>ne</strong></span>",
        ),
        # Truncate after block level tag
        (
            "<section><p>Important text goes here</p></section>",
            "<section><p>Important text goes here",
        ),
    ],
)
def test_truncate_html_safe(
    html_str,
    expected_html,
):

    res = truncate_html_safe(html_str, 50)
    assert res == expected_html
