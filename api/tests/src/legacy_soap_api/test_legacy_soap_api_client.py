import logging
from unittest.mock import MagicMock, patch

import pytest

from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListResponse,
    OpportunityDetails,
)
from src.legacy_soap_api.legacy_soap_api_client import BaseSOAPClient, SimplerApplicantsS2SClient
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.util.datetime_util import parse_grants_gov_date
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
)
from tests.src.legacy_soap_api.soap_request_templates import (
    get_opportunity_list_requests as mock_requests,
)
from tests.util.minifiers import minify_xml


def get_simpler_applicants_soap_client(request_data, db_session):
    soap_request = SOAPRequest(
        method="POST",
        headers={},
        data=request_data,
        full_path="/grantsws-applicant/services/v2/ApplicantWebServicesSoapPort",
        api_name=SimplerSoapAPI.APPLICANTS,
    )
    return SimplerApplicantsS2SClient(soap_request, db_session)


class TestSimplerSOAPApplicantsClientGetOpportunityList:
    @pytest.fixture(autouse=True)
    def truncate_competitions(self, db_session):
        # This will truncate the competitions and related data for each test within this test class.
        cascade_delete_from_db_table(db_session, Competition)
        cascade_delete_from_db_table(db_session, Opportunity)

    @patch("src.legacy_soap_api.legacy_soap_api_proxy.get_proxy_response")
    def test_get_opportunity_list_response(self, mock_proxy_request, db_session):
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_opportunity_number_request(
                opportunity_number="HDTRA1-25-S-0001"
            ).encode(),
            db_session=db_session,
        )
        assert client.operation_config.request_operation_name == "GetOpportunityListRequest"
        assert client.operation_config.response_operation_name == "GetOpportunityListResponse"
        assert client.GetOpportunityListRequest() is not None
        simpler_soap_response, use_simpler = client.get_simpler_soap_response(
            mock_proxy_request_response
        )
        assert isinstance(simpler_soap_response, SOAPResponse)

    @patch("src.legacy_soap_api.legacy_soap_api_proxy.get_proxy_response")
    def test_get_opportunity_list_response_by_package_id(
        self, mock_proxy_request, db_session, enable_factory_create
    ):
        # Create an opportunity with a competition
        package_id = "PKG-SOAPCLIENT11"
        CompetitionFactory.create(
            opportunity=OpportunityFactory.create(), legacy_package_id=package_id
        )
        mock_proxy_request_response = MagicMock()
        mock_proxy_request.return_value = mock_proxy_request_response
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_package_id_request(package_id).encode(),
            db_session=db_session,
        )
        assert client.operation_config.request_operation_name == "GetOpportunityListRequest"
        assert client.operation_config.response_operation_name == "GetOpportunityListResponse"
        opportunity_list_response = client.GetOpportunityListRequest()
        assert len(opportunity_list_response.opportunity_details) == 1
        assert opportunity_list_response.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_package_id(self, db_session, enable_factory_create):
        package_id = "PKG-00260155"
        opportunity = OpportunityFactory.create()
        CompetitionFactory.create(opportunity=opportunity, legacy_package_id=package_id)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_package_id_request(package_id).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].package_id == package_id

    def test_get_opportunity_list_by_competition_id_and_opportunity_number(
        self, db_session, enable_factory_create
    ):
        opportunity_number = "123"
        competition_id = "ABC-134-56789"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity, public_competition_id=competition_id)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_competition_id_and_opportunity_number_request(
                competition_id, opportunity_number
            ).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].competition_id == competition_id
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

    def test_get_opportunity_list_by_opportunity_filter_opportunity_number(
        self, db_session, enable_factory_create
    ):
        opportunity_number = "1234"
        opportunity = OpportunityFactory.create(opportunity_number=opportunity_number)
        CompetitionFactory.create(opportunity=opportunity)
        client = get_simpler_applicants_soap_client(
            mock_requests.get_opportunity_list_by_opportunity_number_request(
                opportunity_number
            ).encode(),
            db_session,
        )
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 1
        assert result.opportunity_details[0].funding_opportunity_number == opportunity_number

        # Test adding another competition results in entries returned
        CompetitionFactory.create(opportunity=opportunity, public_competition_id="ABC-134-22222")
        result = client.GetOpportunityListRequest()
        assert len(result.opportunity_details) == 2

    def test_get_opportunity_list_by_assistance_listing_number(
        self, db_session, enable_factory_create
    ):
        assistance_listing_number = "10.10"
        program_title = "Fake program title"
        legacy_package_id = "PKG-SOAPPACKAGE"
        is_multi_package = True  # will resolve to "true"
        closing_date = "9999-10-31"
        opening_date = "1999-10-31"
        funding_opportunity_title = "Rando title"
        funding_opportunity_number = "NOT-648-82"
        competition_id = "ABC-134-43424"
        competition_title = "Fake m5 comp"
        agency_contact_info = "Agency contact info"
        schema_url = f"http://mock-applicants-soap-api/apply/opportunities/schemas/applicant/{legacy_package_id}.xsd"

        mock_competition = CompetitionFactory.create(
            public_competition_id=competition_id,
            is_multi_package=is_multi_package,
            legacy_package_id=legacy_package_id,
            opening_date=parse_grants_gov_date(opening_date),
            closing_date=parse_grants_gov_date(closing_date),
            competition_title=competition_title,
            contact_info=agency_contact_info,
            opportunity_assistance_listing=OpportunityAssistanceListingFactory(
                assistance_listing_number=assistance_listing_number,
                program_title=program_title,
            ),
            opportunity=OpportunityFactory.build(
                opportunity_title=funding_opportunity_title,
                opportunity_number=funding_opportunity_number,
                agency_code="TEST",
                agency_record=None,
            ),
        )

        simpler_soap_client = get_simpler_applicants_soap_client(
            request_data=mock_requests.get_opportunity_list_by_assistance_listing_number(
                assistance_listing_number
            ).encode(),
            db_session=db_session,
        )

        assert simpler_soap_client._get_simpler_soap_response_schema() == GetOpportunityListResponse

        expected_soap_request_dict = {
            "OpportunityFilter": {"CFDANumber": assistance_listing_number}
        }
        assert simpler_soap_client.get_soap_request_dict() == expected_soap_request_dict

        expected_simpler_data = GetOpportunityListResponse(
            opportunity_details=[
                OpportunityDetails(
                    is_multi_project="true",
                    cfda_details=CFDADetails(
                        number=assistance_listing_number,
                        title=program_title,
                    ),
                    package_id=mock_competition.legacy_package_id,
                    agency_contact_info=mock_competition.contact_info,
                    offering_agency=mock_competition.opportunity.agency_name,
                    schema_url=schema_url,
                    funding_opportunity_title=funding_opportunity_title,
                    funding_opportunity_number=funding_opportunity_number,
                    competition_title=competition_title,
                    competition_id=competition_id,
                    closing_date=parse_grants_gov_date(closing_date),
                    opening_date=parse_grants_gov_date(opening_date),
                )
            ]
        )

        # Expected XML is formatted for visual aid and minified for equality.
        expected_simpler_soap_response_xml = minify_xml(
            f"""
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
        <ns2:GetOpportunityListResponse xmlns:ns2="http://apply.grants.gov/services/ApplicantWebServices-V2.0" xmlns:ns3="http://schemas.xmlsoap.org/wsdl/" xmlns:ns4="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:ns5="http://apply.grants.gov/system/ApplicantCommonElements-V1.0" xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">
            <ns5:OpportunityDetails>
                <AgencyContactInfo>{agency_contact_info}</AgencyContactInfo>
                <ns5:CFDADetails>
                    <ns5:Number>{assistance_listing_number}</ns5:Number>
                    <ns5:Title>{program_title}</ns5:Title>
                </ns5:CFDADetails>
                <ns5:ClosingDate>{closing_date}</ns5:ClosingDate>
                <CompetitionID>{competition_id}</CompetitionID>
                <CompetitionTitle>{competition_title}</CompetitionTitle>
                <FundingOpportunityNumber>{funding_opportunity_number}</FundingOpportunityNumber>
                <FundingOpportunityTitle>{funding_opportunity_title}</FundingOpportunityTitle>
                <IsMultiProject>true</IsMultiProject>
                <ns5:OpeningDate>{opening_date}</ns5:OpeningDate>
                <PackageID>{legacy_package_id}</PackageID>
                <SchemaURL>{schema_url}</SchemaURL>
            </ns5:OpportunityDetails>
        </ns2:GetOpportunityListResponse>
    </soap:Body>
</soap:Envelope>"""
        )

        # This is only testing the simpler soap response so we can leave proxy response empty.
        mock_proxy_response = SOAPResponse(data=b"", status_code=200, headers={})
        simpler_response, use_simpler = simpler_soap_client.get_simpler_soap_response(
            mock_proxy_response
        )

        assert simpler_response.data == expected_simpler_soap_response_xml.encode()
        assert (
            simpler_soap_client.get_soap_response_dict()
            == expected_simpler_data.to_soap_envelope_dict(
                simpler_soap_client.operation_config.response_operation_name
            )
        )


class TestSimplerBaseSOAPClient:

    def xml_streamer(self):
        yield b"<soap:Envelope><Body><GetOpportunityListResponse><OpportunityDetails>"
        yield (b"<ns5:OpeningDate>2025-07-20-04:00</ns5:OpeningDate>")
        yield b"</OpportunityDetails></GetOpportunityListResponse></Body></soap:Envelope>"

    def test_get_proxy_soap_response_dict_handles_data_that_is_generator(self, db_session):
        soap_request = SOAPRequest(
            data=b"<soap:Envelope><Body><GetOpportunityListRequest></GetOpportunityListRequest></Body></soap:Envelope>",
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        client = BaseSOAPClient(soap_request, db_session)
        proxy_response = SOAPResponse(data=self.xml_streamer(), status_code=200, headers={})
        proxy_soap_response_dict = client.get_proxy_soap_response_dict(proxy_response)
        expected = {
            "Envelope": {
                "Body": {
                    "GetOpportunityListResponse": {
                        "OpportunityDetails": [{"OpeningDate": "2025-07-20"}]
                    }
                }
            }
        }
        assert proxy_soap_response_dict == expected

    def test_get_simpler_soap_response_when_operation_is_get_ooportunity_list_request_compares_responses(
        self, db_session, caplog
    ):
        soap_request = SOAPRequest(
            data=b"<soap:Envelope><Body><GetOpportunityListRequest></GetOpportunityListRequest></Body></soap:Envelope>",
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.APPLICANTS,
            operation_name="GetOpportunityListRequest",
        )
        client = BaseSOAPClient(soap_request, db_session)
        proxy_response = SOAPResponse(data=self.xml_streamer(), status_code=200, headers={})
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient.get_soap_response_dict"
        ) as mock_soap_response_dict:
            caplog.set_level(logging.DEBUG)
            mock_soap_response_dict.return_value = {}
            with patch(
                "src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient.get_proxy_soap_response_dict"
            ) as mock_get_proxy_soap_response_dict:
                client.get_simpler_soap_response(proxy_response)
                assert len(caplog.records) == 1
                assert caplog.records[0].message == "soap_api_diff complete"
                mock_get_proxy_soap_response_dict.assert_called_once_with(proxy_response)

    def test_get_simpler_soap_response_when_operation_is_not_get_opportunity_list_request_does_not_compare_responses(
        self, db_session, caplog
    ):
        with patch(
            "src.legacy_soap_api.legacy_soap_api_client.SOAPRequest.get_soap_request_operation_config"
        ) as mock_config:
            mock_config.return_value = SOAPOperationConfig(
                request_operation_name="GetOpportunityListRequest",
                response_operation_name="GetOpportunityListResponse",
                force_list_attributes=("OpportunityDetails",),
                key_indexes={"OpportunityDetails": "CompetitionID"},
                compare_endpoints=False,
                namespace_keymap={
                    "GetOpportunityListResponse": "ns2",
                },
            )
            soap_request = SOAPRequest(
                data=b"<soap:Envelope><Body><GetOpportunityListRequest></GetOpportunityListRequest></Body></soap:Envelope>",
                full_path="x",
                headers={},
                method="POST",
                api_name=SimplerSoapAPI.APPLICANTS,
                operation_name="GetOpportunityListRequest",
            )
            client = BaseSOAPClient(soap_request, db_session)
            with patch(
                "src.legacy_soap_api.legacy_soap_api_client.build_xml_from_dict"
            ) as mock_build_xml_from_dict:
                mock_build_xml_from_dict.return_value = b""
                proxy_response = SOAPResponse(data=self.xml_streamer(), status_code=200, headers={})
                with patch(
                    "src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient.get_soap_response_dict"
                ) as mock_soap_response_dict:
                    caplog.set_level(logging.DEBUG)
                    mock_soap_response_dict.return_value = {}
                    with patch(
                        "src.legacy_soap_api.legacy_soap_api_client.BaseSOAPClient.get_proxy_soap_response_dict"
                    ) as mock_get_proxy_soap_response_dict:
                        mock_get_proxy_soap_response_dict.assert_not_called()
                    client.get_simpler_soap_response(proxy_response)
                    assert len(caplog.records) == 0
