from src.legacy_soap_api.legacy_soap_api_config import LegacySoapAPIConfig, get_soap_config


def test_get_soap_config():
    assert isinstance(get_soap_config(), LegacySoapAPIConfig)
