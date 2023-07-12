import pytest

import src.logging.pii as pii


@pytest.mark.parametrize(
    "input,expected",
    [
        ("", ""),
        ("1234", "1234"),
        (1234, 1234),
        (None, None),
        ("hostname ip-10-11-12-134.ec2.internal", "hostname ip-10-11-12-134.ec2.internal"),
        ({}, {}),
        ("123456789", "*********"),
        (123456789, "*********"),
        ("123-45-6789", "*********"),
        ("123456789 test", "********* test"),
        ("test 123456789", "test *********"),
        ("test 123456789 test", "test ********* test"),
        ("test=999000000.", "test=*********."),
        ("test=999000000,", "test=*********,"),
        (999000000.5, 999000000.5),
        ({"a": "x", "b": "999000000"}, "{'a': 'x', 'b': '*********'}"),
    ],
)
def test_mask_pii(input, expected):
    assert pii._mask_pii(input) == expected
