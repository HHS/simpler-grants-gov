import pytest

from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPInvalidEnvelope
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_soap_operation_dict

GRANTS_GOV_TRACKING_NUMBER_1 = "GRANT80000000"
GRANTS_GOV_TRACKING_NUMBER_2 = "GRANT80000001"
GRANTS_GOV_TRACKING_NUMBER_3 = "GRANT80000002"


class TestLegacySoapGrantorGetSubmissionListExtendedSchema:
    def test_get_submission_list_expanded_request_schema_can_consumed_incoming_request_xml_with_all_filters(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>CFDA-PER-123</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            f"<gran:FilterValue>CFDA-PER-124</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            f"<gran:FilterValue>FundingOppNumber-PER-123</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            f"<gran:FilterValue>FundingOppNumber-PER-124</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        expected = {
            "expanded_application_filter": {
                "filters": {
                    "CFDANumber": ["CFDA-PER-123", "CFDA-PER-124"],
                    "FundingOpportunityNumber": [
                        "FundingOppNumber-PER-123",
                        "FundingOppNumber-PER-124",
                    ],
                    "GrantsGovTrackingNumber": [
                        int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1])
                    ],
                }
            }
        }
        assert schema.model_dump() == expected

    def test_get_submission_list_expanded_request_schema_throws_exception_if_filter_types_but_no_filter_value(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        with pytest.raises(SOAPInvalidEnvelope) as e:
            grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        assert (
            f"{e.value}"
            == "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterValue}' is expected."
        )

    def test_get_submission_list_expanded_request_schema_throws_exception_if_filter_value_but_no_filter_type(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterValue>GrantsGovTrackingNumber</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        with pytest.raises(SOAPInvalidEnvelope) as e:
            grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        assert (
            f"{e.value}"
            == "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' is expected."
        )

    def test_get_submission_list_expanded_request_schema_can_consumed_incoming_request_xml_with_one_filter(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        expected = {
            "expanded_application_filter": {
                "filters": {
                    "GrantsGovTrackingNumber": [int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1])]
                }
            }
        }
        assert schema.model_dump() == expected

    def test_get_submission_list_expanded_request_schema_can_consumed_incoming_request_xml_with_more_than_one_filter_of_same_type(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_2}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_3}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        expected = {
            "expanded_application_filter": {
                "filters": {
                    "GrantsGovTrackingNumber": [
                        int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1]),
                        int(GRANTS_GOV_TRACKING_NUMBER_2.split("GRANT")[1]),
                        int(GRANTS_GOV_TRACKING_NUMBER_3.split("GRANT")[1]),
                    ]
                }
            }
        }
        assert schema.model_dump() == expected

    def test_get_submission_list_expanded_request_schema_can_consumed_incoming_request_xml_with_no_filter_values(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = (
            get_soap_operation_dict(str(payload.payload), payload.operation_name) or {}
        )
        schema = grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        assert schema.model_dump() == {"expanded_application_filter": None}

    def test_get_submission_list_expanded_request_filters_created_by_multiple_statuses(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetSubmissionListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Rejected with Errors</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Validated</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>Status</gran:FilterType>"
            "<gran:FilterValue>Received</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetSubmissionListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetSubmissionListExpandedRequest(**soap_operation_dict)
        expected = {
            "expanded_application_filter": {
                "filters": {"Status": ["Rejected with Errors", "Validated", "Received"]}
            }
        }
        assert schema.model_dump() == expected
