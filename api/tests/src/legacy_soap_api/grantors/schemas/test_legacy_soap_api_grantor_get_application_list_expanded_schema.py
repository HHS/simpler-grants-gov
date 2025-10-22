from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_soap_operation_dict

GRANTS_GOV_TRACKING_NUMBER_1 = "GRANT80000000"
GRANTS_GOV_TRACKING_NUMBER_2 = "GRANT80000001"
GRANTS_GOV_TRACKING_NUMBER_3 = "GRANT80000002"


class TestLegacySoapGrantorGetApplicationListExtendedSchema:
    def test_get_application_list_expanded_request_schema_can_consumed_incoming_request_xml_with_one_filter(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_1}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert schema.model_dump() == {
            "expanded_application_filter": {
                "filter_type": "GrantsGovTrackingNumber",
                "grants_gov_tracking_numbers": [
                    int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1])
                ],
            }
        }

    def test_get_application_list_expanded_request_schema_can_consumed_incoming_request_xml_with_more_than_one_filter(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_1}</gran:FilterValue>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_2}</gran:FilterValue>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_3}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert schema.model_dump() == {
            "expanded_application_filter": {
                "filter_type": "GrantsGovTrackingNumber",
                "grants_gov_tracking_numbers": [
                    int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1]),
                    int(GRANTS_GOV_TRACKING_NUMBER_2.split("GRANT")[1]),
                    int(GRANTS_GOV_TRACKING_NUMBER_3.split("GRANT")[1]),
                ],
            }
        }

    def test_get_application_list_expanded_request_schema_can_consumed_incoming_request_xml_with_no_filter_values(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert schema.model_dump() == {
            "expanded_application_filter": {
                "filter_type": "GrantsGovTrackingNumber",
                "grants_gov_tracking_numbers": [],
            }
        }
