from src.util.string_utils import join_list


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
