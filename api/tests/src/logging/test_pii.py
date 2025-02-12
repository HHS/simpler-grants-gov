import logging

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


@pytest.mark.parametrize(
    "input_value,expected_output",
    [
        # Basic SSN patterns that should be masked
        ("123456789", "*********"),
        ("123-45-6789", "*********"),
        # IP addresses that should not be masked
        ("ip-10-11-12-134", "ip-10-11-12-134"),
        # Floating point numbers that should not be masked
        ("5.999000000", "5.999000000"),
        ("999000000.5", "999000000.5"),
        ("0.999000000", "0.999000000"),
        ("999.000000", "999.000000"),
        # Mixed content
        ("SSN: 123456789 Amount: 999000000.5", "SSN: ********* Amount: 999000000.5"),
        ("IP: ip-10-11-12-134 SSN: 123-45-6789", "IP: ip-10-11-12-134 SSN: *********"),
    ],
)
def test_mask_pii_logging_floats(input_value, expected_output):
    # Create a LogRecord with the test value
    record = logging.LogRecord(
        name="test",
        level=logging.INFO,
        pathname="test.py",
        lineno=1,
        msg=input_value,
        args=(),
        exc_info=None,
    )

    # Apply PII masking
    pii.mask_pii(record)

    # Check that the message was properly masked
    assert record.msg == expected_output
