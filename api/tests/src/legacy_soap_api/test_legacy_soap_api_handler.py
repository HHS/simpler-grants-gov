import pytest

from src.legacy_soap_api.legacy_soap_api_handler import LegacySOAPRequestHandler


class TestSOAPRequestHandler:
    @pytest.fixture(scope="class")
    def legacy_soap_handler(self) -> None:
        class MockRequest:
            headers = {}
            method = "POST"
            data = b"data"
            status_code = 200
            full_path = "/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort"

        return LegacySOAPRequestHandler(
            request=MockRequest(),
            service_name="grantsws-applicant",
            service_port_name="ApplicantWebServicesSoapPort",
        )

    def test_can_instantiate(self, legacy_soap_handler) -> None:
        assert isinstance(legacy_soap_handler, LegacySOAPRequestHandler)
