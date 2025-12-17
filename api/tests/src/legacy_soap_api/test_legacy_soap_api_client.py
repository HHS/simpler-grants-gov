import logging
import uuid
from collections.abc import Iterator
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest
import pytz
import requests
from apiflask import HTTPError
from botocore.exceptions import ClientError
from sqlalchemy import update

from src.constants.lookup_constants import ApplicationStatus, Privilege
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import AgencyUser, LegacyCertificate
from src.legacy_soap_api.applicants.schemas import (
    CFDADetails,
    GetOpportunityListResponse,
    OpportunityDetails,
)
from src.legacy_soap_api.legacy_soap_api_auth import SOAPAuth
from src.legacy_soap_api.legacy_soap_api_client import (
    BaseSOAPClient,
    SimplerApplicantsS2SClient,
    SimplerGrantorsS2SClient,
)
from src.legacy_soap_api.legacy_soap_api_config import SimplerSoapAPI, SOAPOperationConfig
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPRequest, SOAPResponse
from src.util.datetime_util import parse_grants_gov_date
from tests.lib.data_factories import setup_cert_user
from tests.lib.db_testing import cascade_delete_from_db_table
from tests.src.db.models.factories import (
    AgencyFactory,
    ApplicationFactory,
    ApplicationSubmissionFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    CompetitionFactory,
    OpportunityAssistanceListingFactory,
    OpportunityFactory,
    OrganizationFactory,
)
from tests.src.legacy_soap_api.soap_request_templates import (
    get_opportunity_list_requests as mock_requests,
)
from tests.util.minifiers import minify_xml

GRANTS_GOV_TRACKING_NUMBER = "GRANT80000000"
CID_UUID = "aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"
BOUNDARY_UUID = "cccccccc-1111-2222-3333-dddddddddddd"
TZ_EST = pytz.timezone("America/New_York")
DT_NAIVE = datetime(2025, 9, 9, 8, 15, 17)
DT_EST_AWARE = TZ_EST.localize(DT_NAIVE)


@pytest.fixture(autouse=True)
def cleanup_agencies(db_session):
    cascade_delete_from_db_table(db_session, AgencyUser)
    db_session.execute(update(LegacyCertificate).values(agency_id=None))
    db_session.commit()


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
        simpler_soap_response = client.get_simpler_soap_response(mock_proxy_request_response)
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
        simpler_response = simpler_soap_client.get_simpler_soap_response(mock_proxy_response)

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

    def test_get_simpler_soap_response_when_operation_is_get_opportunity_list_request_compares_responses(
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


class TestSimplerSOAPGetApplicationZip:
    def test_get_simpler_soap_response_returns_mtom_xml(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        agency = AgencyFactory.create()
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        submission = ApplicationSubmissionFactory.create()
        application_user = ApplicationUserFactory.create(
            application=submission.application, user=user
        )
        ApplicationUserRoleFactory.create(application_user=application_user, role=role)
        response = requests.get(submission.download_path, timeout=10)
        submission_text = response.content.decode()
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_simpler_soap_response(mock_proxy_response)
            expected = (
                '--uuid:cccccccc-1111-2222-3333-dddddddddddd\nContent-Type: application/xop+xml; charset=UTF-8; type="text/xml"\nContent-Transfer-Encoding: binary\nContent-ID: <root.message@cxf.apache.org'
                '>\n\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><ns2:GetApplicationZipResponse xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:ns11="htt'
                'p://schemas.xmlsoap.org/wsdl/" xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0" xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" xmlns'
                ':ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0" xmlns:ns6="http://apply.grants.gov/system/GrantsP'
                'ackage-V1.0" xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0" xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0" xmlns:ns3="http://apply.grants.gov'
                '/system/GrantsTemplate-V1.0" xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0"><ns2:FileDataHandler>'
                '<xop:Include xmlns:xop="http://www.w3.org/2004/08/xop/include" href="cid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb-0001@apply.grants.gov"/></ns2:FileDataHandler></ns2:GetApplicationZipResp'
                f"onse></soap:Body></soap:Envelope>\n--uuid:cccccccc-1111-2222-3333-dddddddddddd\n{submission_text}\n--uuid:cccccccc-1111-2222-3333-dddddddddddd--"
            ).encode("utf-8")
            assert isinstance(result.data, Iterator)
            assert b"".join(list(result.data)) == expected
            assert result.status_code == 200
            assert result.headers == {
                "Content-Type": f'multipart/related; type="application/xop+xml"; boundary="uuid:{BOUNDARY_UUID}"; start="<root.message@cxf.apache.org>"; start-info="text/xml"',
                "MIME-Version": "1.0",
            }

    def test_get_simpler_soap_response_returns_error_if_certificate_user_does_not_have_permissions(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        submission = ApplicationSubmissionFactory.create()
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        agency = AgencyFactory.create()
        wrong_privileges = {Privilege.LEGACY_AGENCY_VIEWER}
        user, _, soap_client_certificate = setup_cert_user(agency, wrong_privileges)
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        with pytest.raises(HTTPError):
            client.get_simpler_soap_response(mock_proxy_response)

    def test_get_simpler_soap_response_logging_if_downloading_the_file_from_s3_fails(
        self, db_session, enable_factory_create, caplog
    ):
        caplog.set_level(logging.INFO)
        submission = ApplicationSubmissionFactory.create()
        agency = AgencyFactory()
        user, role, soap_client_certificate = setup_cert_user(
            agency, {Privilege.LEGACY_AGENCY_GRANT_RETRIEVER}
        )
        application_user = ApplicationUserFactory.create(
            application=submission.application, user=user
        )
        ApplicationUserRoleFactory.create(application_user=application_user, role=role)
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{submission.legacy_tracking_number}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        mock_proxy_response = SOAPResponse(data=b"soap", status_code=500, headers={})
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        with patch("src.util.file_util.smart_open.open") as mock_smart_open:
            mock_smart_open.side_effect = ClientError(
                {"Error": {"Code": "NoSuchKey", "Message": "The specified key does not exist."}},
                "GetObject",
            )
            response = client.get_simpler_soap_response(mock_proxy_response)
            msg = f"Unable to retrieve file legacy_tracking_number {submission.legacy_tracking_number} from s3 file location."
            assert msg in caplog.messages
            assert response.data == mock_proxy_response.data
            assert response.status_code == mock_proxy_response.status_code

    def test_get_simpler_soap_response_logging_if_submission_not_found(
        self, db_session, enable_factory_create, caplog
    ):
        caplog.set_level(logging.INFO)
        FAKE_GRANTS_GOV_TRACKING_NUMBER = "GRANT89999999"
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" '
            'xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
            'xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{FAKE_GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        client = SimplerGrantorsS2SClient(soap_request, db_session)
        response = client.get_simpler_soap_response(mock_proxy_response)
        grants_gov_tracking_number = FAKE_GRANTS_GOV_TRACKING_NUMBER.split("GRANT")[1]
        msg = f"Unable to find submission legacy_tracking_number {grants_gov_tracking_number}."
        assert msg in caplog.messages
        assert response.data == mock_proxy_response.data
        assert response.status_code == mock_proxy_response.status_code

    def test_get_simpler_soap_response_returns_proxy_response_if_proxy_response_status_code_is_not_500(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        mock_proxy_response = SOAPResponse(data=b"soap", status_code=200, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_simpler_soap_response(mock_proxy_response)
            assert result.data == mock_proxy_response.data
            assert result.status_code == mock_proxy_response.status_code

    def test_get_simpler_soap_response_returns_proxy_response_if_is_mtom_is_false_on_operation_config(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationZipRequest>"
            f"<gran:GrantsGovTrackingNumber>{GRANTS_GOV_TRACKING_NUMBER}</gran:GrantsGovTrackingNumber>"
            "</agen:GetApplicationZipRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetApplicationZipRequest",
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            # Directly changing the config value here will change it for other tests
            # so for safety I use a MagicMock as the operation_config
            client.operation_config = MagicMock(**client.operation_config.__dict__)
            client.operation_config.is_mtom = False
            result = client.get_simpler_soap_response(mock_proxy_response)
            assert result.data == mock_proxy_response.data
            assert result.status_code == mock_proxy_response.status_code


class TestSimplerSOAPGetSubmissionListExpanded:
    def setup_application_submission(
        self,
        agency,
        legacy_package_id="PKG00118065",
        sam_gov_entity=None,
        application_status=ApplicationStatus.ACCEPTED,
        opportunity_assistance_listing=True,
        has_organization=True,
        legacy_competition_id=1,
    ):
        opportunity = OpportunityFactory.create(agency_code=agency.agency_code)
        competition = CompetitionFactory(
            opportunity=opportunity,
            legacy_package_id=legacy_package_id,
            legacy_competition_id=legacy_competition_id,
            opportunity_assistance_listing=(
                OpportunityAssistanceListingFactory.create(opportunity=opportunity)
                if opportunity_assistance_listing
                else None
            ),
        )
        application_kwargs = dict(
            competition=competition,
            application_status=application_status,
            submitted_at=DT_EST_AWARE,
        )
        if has_organization:
            application_kwargs = application_kwargs | {
                "organization": (
                    OrganizationFactory.create(sam_gov_entity=sam_gov_entity)
                    if sam_gov_entity
                    else OrganizationFactory.create()
                )
            }
        application = ApplicationFactory.create(**application_kwargs)
        return ApplicationSubmissionFactory.create(application=application)

    def test_get_simpler_soap_response_returns_mtom_xml(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        agency = AgencyFactory.create()
        submission = self.setup_application_submission(agency)
        application = submission.application
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        db_session.commit()
        db_session.refresh(application.competition)
        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_simpler_soap_response(mock_proxy_response)
            expected = (
                "--uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"
                "\nContent-Type: application/xop+xml; charset=UTF-8; type"
                '="text/xml"\nContent-Transfer-Encoding: binary\nContent-ID: <root.message@cxf.apache.org>\n\n'
                '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
                "<soap:Body>"
                '<ns2:GetSubmissionListExpandedResponse xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" xmlns:ns1'
                '1="http://schemas.xmlsoap.org/wsdl/" xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynops'
                'is-V2.0" xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" xmlns:ns8="htt'
                'p://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" xmlns:ns7="http://apply.grants.gov/system/'
                'AgencyManagePackage-V1.0" xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0" xmlns:ns5="'
                'http://apply.grants.gov/system/GrantsOpportunity-V1.0" xmlns:ns4="http://apply.grants.gov/system/Gr'
                'antsRelatedDocument-V1.0" xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0" xmlns:ns2='
                '"http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns="http://apply.grants.gov/system/Gra'
                'ntsCommonElements-V1.0">'
                "<ns2:Success>true</ns2:Success>"
                "<ns2:AvailableApplicationNumber>1</ns2:AvailableApplicationNumber>"
                "<ns2:SubmissionInfo>"
                f"<FundingOpportunityNumber>{application.competition.opportunity.opportunity_number}</FundingOpportunityNumber>"
                f"<CFDANumber>{application.competition.opportunity_assistance_listing.assistance_listing_number}</CFDANumber>"
                f"<GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</GrantsGovTrackingNumber>"
                "<ns2:ReceivedDateTime>2025-09-09T08:15:17-04:00</ns2:ReceivedDateTime>"
                "<GrantsGovApplicationStatus>Validated</GrantsGovApplicationStatus>"
                "<SubmissionMethod>web</SubmissionMethod>"
                f"<SubmissionTitle>{application.application_name}</SubmissionTitle>"
                "<PackageID>PKG00118065</PackageID>"
                "<DelinquentFederalDebt>Yes</DelinquentFederalDebt>"
                "<ActiveExclusions>Yes</ActiveExclusions>"
                f"<UEI>{sam_gov_entity.uei}</UEI>"
                "</ns2:SubmissionInfo>"
                "</ns2:GetSubmissionListExpandedResponse>"
                "</soap:Body>"
                "</soap:Envelope>"
                "\n--uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb--"
            ).encode("utf-8")
            assert result.data == expected
            assert result.status_code == 200
            assert result.headers == {
                "Content-Type": 'multipart/related; type="application/xop+xml"; boundary="uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"; start="<root.message@cxf.apache.org>"; start-info="text/xml"',
                "MIME-Version": "1.0",
            }

    def test_get_simpler_soap_response_returns_multiple_objects(
        self, db_session, enable_factory_create, mock_s3_bucket
    ):
        agency = AgencyFactory.create()
        submission = self.setup_application_submission(agency)
        application = submission.application
        sam_gov_entity = application.organization.sam_gov_entity
        sam_gov_entity.has_debt_subject_to_offset = True
        sam_gov_entity.has_exclusion_status = True
        submission_2 = self.setup_application_submission(agency)
        application_2 = submission_2.application
        sam_gov_entity_2 = application_2.organization.sam_gov_entity
        sam_gov_entity_2.has_debt_subject_to_offset = True
        sam_gov_entity_2.has_exclusion_status = True
        db_session.commit()
        db_session.refresh(application.competition)
        db_session.refresh(application_2.competition)
        _, _, soap_client_certificate = setup_cert_user(agency, {Privilege.LEGACY_AGENCY_VIEWER})
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        soap_request = SOAPRequest(
            data=request_xml_bytes,
            full_path="x",
            headers={},
            method="POST",
            api_name=SimplerSoapAPI.GRANTORS,
            operation_name="GetSubmissionListExpandedRequest",
            auth=SOAPAuth(certificate=soap_client_certificate),
        )
        mock_proxy_response = SOAPResponse(data=b"", status_code=500, headers={})
        with patch.object(uuid, "uuid4") as mock_uuid4:
            mock_uuid4.side_effect = [CID_UUID, BOUNDARY_UUID]
            client = SimplerGrantorsS2SClient(soap_request, db_session)
            result = client.get_simpler_soap_response(mock_proxy_response)
            expected = (
                "--uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb\n"
                'Content-Type: application/xop+xml; charset=UTF-8; type="text/xml"\n'
                "Content-Transfer-Encoding: binary\n"
                "Content-ID: <root.message@cxf.apache.org>\n\n"
                '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">'
                "<soap:Body>"
                "<ns2:GetSubmissionListExpandedResponse "
                'xmlns:ns12="http://schemas.xmlsoap.org/wsdl/soap/" '
                'xmlns:ns11="http://schemas.xmlsoap.org/wsdl/" '
                'xmlns:ns10="http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0" '
                'xmlns:ns9="http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0" '
                'xmlns:ns8="http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0" '
                'xmlns:ns7="http://apply.grants.gov/system/AgencyManagePackage-V1.0" '
                'xmlns:ns6="http://apply.grants.gov/system/GrantsPackage-V1.0" '
                'xmlns:ns5="http://apply.grants.gov/system/GrantsOpportunity-V1.0" '
                'xmlns:ns4="http://apply.grants.gov/system/GrantsRelatedDocument-V1.0" '
                'xmlns:ns3="http://apply.grants.gov/system/GrantsTemplate-V1.0" '
                'xmlns:ns2="http://apply.grants.gov/services/AgencyWebServices-V2.0" '
                'xmlns="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
                "<ns2:Success>true</ns2:Success>"
                "<ns2:AvailableApplicationNumber>2</ns2:AvailableApplicationNumber>"
                "<ns2:SubmissionInfo>"
                f"<FundingOpportunityNumber>{application.competition.opportunity.opportunity_number}</FundingOpportunityNumber>"
                f"<CFDANumber>{application.competition.opportunity_assistance_listing.assistance_listing_number}</CFDANumber>"
                f"<GrantsGovTrackingNumber>GRANT{submission.legacy_tracking_number}</GrantsGovTrackingNumber>"
                "<ns2:ReceivedDateTime>2025-09-09T08:15:17-04:00</ns2:ReceivedDateTime>"
                "<GrantsGovApplicationStatus>Validated</GrantsGovApplicationStatus>"
                "<SubmissionMethod>web</SubmissionMethod>"
                f"<SubmissionTitle>{application.application_name}</SubmissionTitle>"
                "<PackageID>PKG00118065</PackageID>"
                "<DelinquentFederalDebt>Yes</DelinquentFederalDebt>"
                "<ActiveExclusions>Yes</ActiveExclusions>"
                f"<UEI>{sam_gov_entity.uei}</UEI>"
                "</ns2:SubmissionInfo>"
                "<ns2:SubmissionInfo>"
                f"<FundingOpportunityNumber>{application_2.competition.opportunity.opportunity_number}</FundingOpportunityNumber>"
                f"<CFDANumber>{application_2.competition.opportunity_assistance_listing.assistance_listing_number}</CFDANumber>"
                f"<GrantsGovTrackingNumber>GRANT{submission_2.legacy_tracking_number}</GrantsGovTrackingNumber>"
                "<ns2:ReceivedDateTime>2025-09-09T08:15:17-04:00</ns2:ReceivedDateTime>"
                "<GrantsGovApplicationStatus>Validated</GrantsGovApplicationStatus>"
                "<SubmissionMethod>web</SubmissionMethod>"
                f"<SubmissionTitle>{application_2.application_name}</SubmissionTitle>"
                "<PackageID>PKG00118065</PackageID>"
                "<DelinquentFederalDebt>Yes</DelinquentFederalDebt>"
                "<ActiveExclusions>Yes</ActiveExclusions>"
                f"<UEI>{sam_gov_entity_2.uei}</UEI>"
                "</ns2:SubmissionInfo>"
                "</ns2:GetSubmissionListExpandedResponse>"
                "</soap:Body>"
                "</soap:Envelope>\n"
                "--uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb--"
            ).encode("utf-8")
            assert result.data == expected
            assert result.status_code == 200
            assert result.headers == {
                "Content-Type": 'multipart/related; type="application/xop+xml"; boundary="uuid:aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb"; start="<root.message@cxf.apache.org>"; start-info="text/xml"',
                "MIME-Version": "1.0",
            }
