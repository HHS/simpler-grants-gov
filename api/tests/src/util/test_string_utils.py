import pytest

from src.util.string_utils import is_valid_uuid, join_list


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
