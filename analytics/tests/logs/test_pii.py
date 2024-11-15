# pylint: disable=protected-access
"""Test our mask_pii logging logic."""

from typing import Any

import pytest
from analytics.logs import pii


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("", ""),
        ("1234", "1234"),
        (1234, 1234),
        (None, None),
        (
            "hostname ip-10-11-12-134.ec2.internal",
            "hostname ip-10-11-12-134.ec2.internal",
        ),
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
def test_mask_pii(value: Any | None, expected: Any | None):
    """Test mask_pii logic with various input values."""
    assert pii._mask_pii(value) == expected  # noqa: SLF001
