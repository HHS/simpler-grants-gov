from unittest import TestCase

from src.legacy_soap_api.legacy_soap_api_client import LegacySOAPClient


class TestLegacySoapAPIClient(TestCase):
    def setUp(cls) -> None:
        cls.client = LegacySOAPClient()

    def test_can_instantiate(cls) -> None:
        assert isinstance(cls.client, LegacySOAPClient)
