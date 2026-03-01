from src.legacy_soap_api.grantors.schemas.update_application_info_schemas import (
    UpdateApplicationInfoRequest,
    UpdateApplicationInfoResponse,
)
from src.legacy_soap_api.legacy_soap_api_client import SimplerGrantorsS2SClient
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_envelope_dict
from tests.src.legacy_soap_api.soap_request_templates.grantors.update_application_info_payloads import (
    get_mock_update_application_info_request_xml,
    get_mock_update_application_info_response_xml,
)


def test_update_application_info_request_xml_parsing() -> None:
    # Set up the mock data values
    grants_gov_tracking_number = "123"
    assign_agency_tracking_number = "456"
    save_agency_notes = "notes"

    # Build the XML request string
    request_xml = get_mock_update_application_info_request_xml(
        grants_gov_tracking_number=grants_gov_tracking_number,
        assign_agency_tracking_number=assign_agency_tracking_number,
        save_agency_notes=save_agency_notes,
    )

    # Test XML dict results
    request_xml_dict = SOAPPayload(
        request_xml, operation_name="UpdateApplicationInfoRequest"
    ).to_dict()
    assert request_xml_dict == {
        "Envelope": {
            "@xmlns:soapenv": "http://schemas.xmlsoap.org/soap/envelope/",
            "@xmlns:agen": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
            "@xmlns:gran": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
            "@xmlns:agen1": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
            "Header": None,
            "Body": {
                "UpdateApplicationInfoRequest": {
                    "GrantsGovTrackingNumber": grants_gov_tracking_number,
                    "AssignAgencyTrackingNumber": assign_agency_tracking_number,
                    "SaveAgencyNotes": save_agency_notes,
                }
            },
        }
    }

    # Test we can successfully create validated schema with expected values
    schema = UpdateApplicationInfoRequest(
        **get_envelope_dict(request_xml_dict, "UpdateApplicationInfoRequest")
    )
    assert schema.grants_gov_tracking_number == grants_gov_tracking_number
    assert schema.assign_agency_tracking_number == assign_agency_tracking_number
    assert schema.save_agency_notes == save_agency_notes


def test_update_application_info_response_xml_parsing() -> None:
    grants_gov_tracking_number = "123"
    response_xml = get_mock_update_application_info_response_xml(grants_gov_tracking_number)
    response_xml_dict = SOAPPayload(
        response_xml, operation_name="UpdateApplicationInfoResponse"
    ).to_dict()
    assert response_xml_dict == {
        "Envelope": {
            "@xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
            "Body": {
                "UpdateApplicationInfoResponse": {
                    "@xmlns:ns12": "http://schemas.xmlsoap.org/wsdl/soap/",
                    "@xmlns:ns11": "http://schemas.xmlsoap.org/wsdl/",
                    "@xmlns:ns10": "http://apply.grants.gov/system/GrantsFundingSynopsis-V2.0",
                    "@xmlns:ns9": "http://apply.grants.gov/system/AgencyUpdateApplicationInfo-V1.0",
                    "@xmlns:ns8": "http://apply.grants.gov/system/GrantsForecastSynopsis-V1.0",
                    "@xmlns:ns7": "http://apply.grants.gov/system/AgencyManagePackage-V1.0",
                    "@xmlns:ns6": "http://apply.grants.gov/system/GrantsPackage-V1.0",
                    "@xmlns:ns5": "http://apply.grants.gov/system/GrantsOpportunity-V1.0",
                    "@xmlns:ns4": "http://apply.grants.gov/system/GrantsRelatedDocument-V1.0",
                    "@xmlns:ns3": "http://apply.grants.gov/system/GrantsTemplate-V1.0",
                    "@xmlns:ns2": "http://apply.grants.gov/services/AgencyWebServices-V2.0",
                    "@xmlns": "http://apply.grants.gov/system/GrantsCommonElements-V1.0",
                    "GrantsGovTrackingNumber": grants_gov_tracking_number,
                    "Success": "true",
                    "AssignAgencyTrackingNumberResult": {"Success": "true"},
                    "SaveAgencyNotesResult": {"Success": "true"},
                }
            },
        }
    }

    schema = UpdateApplicationInfoResponse(
        **get_envelope_dict(response_xml_dict, "UpdateApplicationInfoResponse")
    )
    assert schema.grants_gov_tracking_number == grants_gov_tracking_number
