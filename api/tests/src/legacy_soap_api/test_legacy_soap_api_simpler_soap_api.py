from unittest.mock import patch

from src.legacy_soap_api import legacy_soap_api_config as soap_api_config
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.legacy_soap_api.simpler_soap_api import get_simpler_soap_response


class TestSimplerSoapApi:
    def test_get_simpler_response_when_use_simpler_is_true_returns_simpler_response(
        self, db_session
    ):
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
               <soapenv:Header/>
               <soapenv:Body>
                    <app:GetOpportunityListRequest>
                        <gran:PackageID>PKG-00260155</gran:PackageID>
                    </app:GetOpportunityListRequest>
               </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerApplicantsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            mock_get_simpler_soap_response.return_value = SOAPResponse(
                data=b"simpler", status_code=500, headers={}
            )
            response = get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            assert response.data == b"simpler"

    def test_get_simpler_response_when_use_simpler_is_false_returns_proxy_response(
        self, monkeypatch, db_session
    ):
        soap_api_config.get_soap_config.cache_clear()
        monkeypatch.setenv("USE_SIMPLER", "false")
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
               <soapenv:Header/>
               <soapenv:Body>
                    <app:GetOpportunityListRequest>
                        <gran:PackageID>PKG-00260155</gran:PackageID>
                    </app:GetOpportunityListRequest>
               </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerApplicantsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            mock_get_simpler_soap_response.return_value = SOAPResponse(
                data=b"simpler", status_code=500, headers={}
            )
            response = get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            assert response.data == b"proxy"

    def test_calls_get_simpler_soap_response_when_always_call_simpler_is_true_and_use_simpler_is_true(
        self, db_session
    ):
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
               <soapenv:Header/>
               <soapenv:Body>
                    <app:GetOpportunityListRequest>
                        <gran:PackageID>PKG-00260155</gran:PackageID>
                    </app:GetOpportunityListRequest>
               </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerApplicantsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            mock_get_simpler_soap_response.assert_called_once()

    def test_calls_get_simpler_soap_response_when_always_call_simpler_is_true_and_use_simpler_is_false(
        self, monkeypatch, db_session
    ):
        soap_api_config.get_soap_config.cache_clear()
        monkeypatch.setenv("USE_SIMPLER", "false")
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0" xmlns:app1="http://apply.grants.gov/system/ApplicantCommonElements-V1.0">
               <soapenv:Header/>
               <soapenv:Body>
                    <app:GetOpportunityListRequest>
                        <gran:PackageID>PKG-00260155</gran:PackageID>
                    </app:GetOpportunityListRequest>
               </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerApplicantsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            mock_get_simpler_soap_response.assert_called_once()

    def test_calls_get_simpler_soap_response_when_always_call_simpler_is_false_and_use_simpler_is_true(
        self, monkeypatch, db_session
    ):
        soap_api_config.get_soap_config.cache_clear()
        monkeypatch.setenv("USE_SIMPLER", "true")
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
                <soapenv:Header/>
                <soapenv:Body>
                    <agen:GetApplicationZipRequest>
                        <gran:GrantsGovTrackingNumber>GRANT8000000</gran:GrantsGovTrackingNumber>
                    </agen:GetApplicationZipRequest>
                </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerGrantorsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            mock_get_simpler_soap_response.assert_called_once()

    def test_calls_get_simpler_soap_response_when_always_call_simpler_is_false_and_use_simpler_is_false(
        self, monkeypatch, db_session
    ):
        soap_api_config.get_soap_config.cache_clear()
        monkeypatch.setenv("USE_SIMPLER", "false")
        envelope = """
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
                <soapenv:Header/>
                <soapenv:Body>
                    <agen:GetApplicationZipRequest>
                        <gran:GrantsGovTrackingNumber>GRANT8000000</gran:GrantsGovTrackingNumber>
                    </agen:GetApplicationZipRequest>
                </soapenv:Body>
            </soapenv:Envelope>
        """.encode(
            "utf-8"
        )
        soap_request = SOAPRequest(
            data=envelope,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        soap_proxy_response = SOAPResponse(data=b"proxy", status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SimplerGrantorsS2SClient.get_simpler_soap_response"
        ) as mock_get_simpler_soap_response:
            get_simpler_soap_response(soap_request, soap_proxy_response, db_session)
            mock_get_simpler_soap_response.assert_not_called()
