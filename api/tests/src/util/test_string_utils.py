import pytest

from src.util.string_utils import is_valid_uuid, join_list, truncate_html_inline


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
            "<p>This is a <strong>very big description, here!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
            '<p>This is a <strong>very big description, here!!!!!!!!!!!!!!<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></strong></p>',
        ),
        # Truncate mid-text inside multiple nested inline tags
        (
            "<p>Some <strong>bold and <em>emphasized text here EXTRA WORDS WORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS</p>",
            '<p>Some <strong>bold and <em>emphasized text here EXTRA WORDS WOR<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></em></strong></p>',
        ),
        # Truncate inside deeply nested block tags (block tags intentionally left open)
        (
            "<div>first<div>second<div>third and some extra trailing content EXTRA WORDS EXTRA WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS</div></div></div>",
            '<div>first<div>second<div>third and some extra trailing content E<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></div></div></div>',
        ),
        # Broken / mismatched HTML, truncate after inline content
        (
            "<p>Hello <p><strong>i am here!!!</strong></div></p> EXTRA TEXT EXTRA WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS  EXTRA WORDS",
            '<p>Hello <p><strong>i am here!!!</strong></p> EXTRA TEXT EXTRA WORDS ORDS WOR<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></p>',
        ),
        # Self-closing tag inside truncated text (e.g. <br />)
        (
            "<div>This is a description<br/>with a break tag and more words here EXTRA WORDS EXTRA WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS</div>",
            '<div>This is a description<br/>with a break tag and more wor<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></div>',
        ),
        # Deep nesting with inline tags, truncate mid-inline
        (
            "<section><div><p>This is <span>a deeply <strong>nested example with text EXTRA WORDS EXTRA WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS ORDS WORDS WORDS",
            '<section><div><p>This is <span>a deeply <strong>nested example with text EXTRA WO<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></strong></span></p></div></section>',
        ),
        # Malformed HTML
        (
            "<p>This is a <strong>very long broken inline section that exceeds the fifty character truncation limit easily",
            '<p>This is a <strong>very long broken inline section that exc<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></strong></p>',
        ),
        # Deep malformed nesting with missing closing tags
        (
            "<div><p>First paragraph with enough content to exceed fifty characters easily<div>Second level still open",
            '<div><p>First paragraph with enough content to exceed fift<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a><div>Second level still open</div></p></div>',
        ),
        # Text split across inline tags exceeding 50 characters
        (
            "<p>This text is <em>split across</em> multiple inline <strong>elements and continues further</strong> beyond limit</p>",
            '<p>This text is <em>split across</em> multiple inline <strong>elements<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></strong> beyond limit</p>',
        ),
        # Contains script and long visible text
        (
            "<div><script>var x = 10;</script>This visible content is definitely longer than fifty characters and should truncate properly.</div>",
            '<div><script>var x = 10;</script>This visible content is definitely long<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></div>',
        ),
        # HTML entities count as characters
        (
            "<p>This&nbsp;content&nbsp;contains&nbsp;entities&nbsp;and continues well beyond fifty characters total.</p>",
            '<p>This\xa0content\xa0contains\xa0entities\xa0and continues well<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></p>',
        ),
        # Self-closing tags with long text after
        (
            "<div>Line one<br/>Line two<br/>Line three continues long enough to exceed the fifty character truncation point easily.</div>",
            '<div>Line one<br/>Line two<br/>Line three continues long enough t<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></div>',
        ),
        # Multiple sibling blocks, truncation in first
        (
            "<div>First block with enough content to exceed fifty characters before the next div.</div><div>Second block</div>",
            '<div>First block with enough content to exceed fifty ch<a href="http://testhost:3000/opportunity/1" style="color:blue;">...Read full description</a></div><div>Second block</div>',
        ),
    ],
)
def test_truncate_html_inline(
    html_str,
    expected_html,
):

    res = truncate_html_inline(
        html_str,
        50,
        "<a href='http://testhost:3000/opportunity/1' style='color:blue;'>...Read full description</a>",
    )
    assert res == expected_html
