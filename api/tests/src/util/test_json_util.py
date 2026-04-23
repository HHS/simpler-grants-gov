from datetime import date, datetime, timezone
from decimal import Decimal
from enum import Enum
from uuid import UUID, uuid4

from src.util.json_util import ENCODERS_BY_TYPE, identity, json_encoder


class TestIdentity:
    """Tests for the identity function."""

    def test_identity_returns_same_object(self):
        obj = object()
        assert identity(obj) is obj

    def test_identity_preserves_primitives(self):
        assert identity(42) == 42
        assert identity("hello") == "hello"
        assert identity(True) is True

    def test_identity_preserves_collections(self):
        lst = [1, 2, 3]
        assert identity(lst) is lst

        d = {"key": "value"}
        assert identity(d) is d


class SampleEnum(Enum):
    """Test enum for encoder tests."""

    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = 1


class TestJsonEncoder:
    """Tests for the json_encoder function covering all registered type handlers."""

    # -- Identity types (pass through unchanged) --

    def test_encoder_str(self):
        value = "hello world"
        result = json_encoder(value)
        assert result == "hello world"
        assert result is value  # identity function returns same object

    def test_encoder_int(self):
        value = 42
        result = json_encoder(value)
        assert result == 42
        assert result is value

    def test_encoder_float(self):
        value = 3.14
        result = json_encoder(value)
        assert result == 3.14
        assert result is value

    def test_encoder_bool(self):
        assert json_encoder(True) is True
        assert json_encoder(False) is False

    def test_encoder_list(self):
        value = [1, "two", 3.0]
        result = json_encoder(value)
        assert result == [1, "two", 3.0]
        assert result is value

    # -- datetime conversion --

    def test_encoder_datetime(self):
        dt = datetime(2025, 6, 15, 10, 30, 0, tzinfo=timezone.utc)
        result = json_encoder(dt)
        assert result == "2025-06-15T10:30:00+00:00"

    def test_encoder_datetime_without_tz(self):
        dt = datetime(2025, 6, 15, 10, 30, 0)
        result = json_encoder(dt)
        assert result == "2025-06-15T10:30:00"

    # -- date conversion --

    def test_encoder_date(self):
        d = date(2025, 6, 15)
        result = json_encoder(d)
        assert result == "2025-06-15"

    # -- Enum conversion --

    def test_encoder_enum_string_value(self):
        result = json_encoder(SampleEnum.ACTIVE)
        assert result == "active"

    def test_encoder_enum_int_value(self):
        result = json_encoder(SampleEnum.PENDING)
        assert result == 1

    # -- set conversion --

    def test_encoder_set(self):
        value = {1, 2, 3}
        result = json_encoder(value)
        assert isinstance(result, list)
        assert set(result) == {1, 2, 3}

    def test_encoder_empty_set(self):
        result = json_encoder(set())
        assert result == []

    # -- Decimal conversion --

    def test_encoder_decimal(self):
        result = json_encoder(Decimal("123.45"))
        assert result == "123.45"
        assert isinstance(result, str)

    def test_encoder_decimal_scientific(self):
        result = json_encoder(Decimal("1E+10"))
        assert result == "1E+10"

    # -- UUID conversion --

    def test_encoder_uuid(self):
        uid = uuid4()
        result = json_encoder(uid)
        assert result == str(uid)
        assert isinstance(result, str)

    # -- Exception conversion --

    def test_encoder_exception(self):
        exc = ValueError("something went wrong")
        result = json_encoder(exc)
        assert result == "something went wrong"

    def test_encoder_exception_no_message(self):
        exc = RuntimeError()
        result = json_encoder(exc)
        assert result == ""

    # -- Fallback: unknown types --

    def test_encoder_fallback_dict(self):
        """dict is not registered, so falls back to str()."""
        value = {"key": "value"}
        result = json_encoder(value)
        assert result == str(value)
        assert isinstance(result, str)

    def test_encoder_fallback_custom_object(self):
        class CustomObject:
            def __str__(self):
                return "custom-repr"

        result = json_encoder(CustomObject())
        assert result == "custom-repr"

    def test_encoder_fallback_none(self):
        """NoneType is not registered, falls back to str()."""
        result = json_encoder(None)
        assert result == "None"


class TestEncodersByType:
    """Verify the ENCODERS_BY_TYPE registry is complete."""

    def test_registry_has_expected_types(self):
        expected_types = {str, int, float, bool, list, datetime, date, Enum, set, Decimal, UUID, Exception}
        registered_types = set(ENCODERS_BY_TYPE.keys())
        assert expected_types == registered_types

    def test_all_encoders_are_callable(self):
        for type_cls, encoder_fn in ENCODERS_BY_TYPE.items():
            assert callable(encoder_fn), f"Encoder for {type_cls} is not callable"
