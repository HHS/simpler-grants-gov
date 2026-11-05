import zoneinfo
from datetime import datetime

import pytest

from src.legacy_soap_api.grantors import schemas as grantors_schemas
from src.legacy_soap_api.legacy_soap_api_schemas import SOAPInvalidEnvelope
from src.legacy_soap_api.soap_payload_handler import SOAPPayload, get_soap_operation_dict

GRANTS_GOV_TRACKING_NUMBER_1 = "GRANT80000000"
GRANTS_GOV_TRACKING_NUMBER_2 = "GRANT80000001"
GRANTS_GOV_TRACKING_NUMBER_3 = "GRANT80000002"


class TestLegacySoapGrantorGetApplicationListExpandedSchema:
    def test_get_application_list_expanded_request_schema_can_consume_incoming_request_xml_with_all_filters(
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
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            "<gran:FilterValue>CFDA-PER-123</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>CFDANumber</gran:FilterType>"
            "<gran:FilterValue>CFDA-PER-124</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            "<gran:FilterValue>FundingOppNumber-PER-123</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>FundingOpportunityNumber</gran:FilterType>"
            "<gran:FilterValue>FundingOppNumber-PER-124</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        expected = [
            {"filter_type": "CFDANumber", "filter_value": "CFDA-PER-123"},
            {"filter_type": "CFDANumber", "filter_value": "CFDA-PER-124"},
            {"filter_type": "FundingOpportunityNumber", "filter_value": "FundingOppNumber-PER-123"},
            {"filter_type": "FundingOpportunityNumber", "filter_value": "FundingOppNumber-PER-124"},
            {
                "filter_type": "GrantsGovTrackingNumber",
                "filter_value": int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1]),
            },
        ]
        assert sorted(
            schema.model_dump()["expanded_application_filter"]["filters"],
            key=lambda x: x["filter_type"],
        ) == sorted(expected, key=lambda x: x["filter_type"])

    def test_get_application_list_expanded_request_schema_throws_exception_if_filter_type_but_no_filter_value(
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
        with pytest.raises(SOAPInvalidEnvelope) as e:
            grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert (
            f"{e.value}"
            == "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterValue}' is expected."
        )

    def test_get_application_list_expanded_request_schema_throws_exception_if_filter_value_but_no_filter_type(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterValue>GrantsGovTrackingNumber</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        with pytest.raises(SOAPInvalidEnvelope) as e:
            grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert (
            f"{e.value}"
            == "The content of element 'ExpandedApplicationFilter' is not complete. One of '{\"http://apply.grants.gov/system/GrantsCommonElements-V1.0\":FilterType}' is expected."
        )

    def test_get_application_list_expanded_request_schema_can_consume_incoming_request_xml_with_no_filters(
        self, db_session
    ):
        request_xml_bytes = (
            '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:agen="http://apply.grants.gov/services/AgencyWebServices-V2.0" xmlns:gran="http://apply.grants.gov/system/GrantsCommonElements-V1.0">'
            "<soapenv:Header/>"
            "<soapenv:Body>"
            "<agen:GetApplicationListExpandedRequest>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = (
            get_soap_operation_dict(str(payload.payload), payload.operation_name) or {}
        )
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        assert schema.model_dump() == {"expanded_application_filter": None}

    def test_get_application_list_expanded_request_schema_can_consume_multiple_same_type_filters(
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
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_2}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "<gran:ExpandedApplicationFilter>"
            "<gran:FilterType>GrantsGovTrackingNumber</gran:FilterType>"
            f"<gran:FilterValue>{GRANTS_GOV_TRACKING_NUMBER_3}</gran:FilterValue>"
            "</gran:ExpandedApplicationFilter>"
            "</agen:GetApplicationListExpandedRequest>"
            "</soapenv:Body>"
            "</soapenv:Envelope>"
        ).encode("utf-8")
        payload = SOAPPayload(soap_payload=request_xml_bytes.decode())
        soap_operation_dict = get_soap_operation_dict(str(payload.payload), payload.operation_name)
        schema = grantors_schemas.GetApplicationListExpandedRequest(**soap_operation_dict)
        expected = {
            "expanded_application_filter": {
                "filters": [
                    {
                        "filter_type": "GrantsGovTrackingNumber",
                        "filter_value": int(GRANTS_GOV_TRACKING_NUMBER_1.split("GRANT")[1]),
                    },
                    {
                        "filter_type": "GrantsGovTrackingNumber",
                        "filter_value": int(GRANTS_GOV_TRACKING_NUMBER_2.split("GRANT")[1]),
                    },
                    {
                        "filter_type": "GrantsGovTrackingNumber",
                        "filter_value": int(GRANTS_GOV_TRACKING_NUMBER_3.split("GRANT")[1]),
                    },
                ]
            }
        }
        assert schema.model_dump() == expected


class TestExpandedApplicationInfoTimezoneValidation:
    SUBMISSION_DEFAULTS = {
        "FundingOpportunityNumber": "OPP-001",
        "CFDANumber": "10.001",
        "GrantsGovTrackingNumber": "GRANT12345",
        "GrantsGovApplicationStatus": "Received",
        "SubmissionMethod": "web",
        "SubmissionTitle": "Test",
        "PackageID": "PKG-001",
        "DelinquentFederalDebt": "No",
        "ActiveExclusions": "No",
    }

    def _make_expanded_application_info(self, received_date_time):
        return grantors_schemas.ExpandedApplicationInfo(
            **{**self.SUBMISSION_DEFAULTS, "ns2:ReceivedDateTime": received_date_time}
        )

    def test_naive_datetime_is_made_timezone_aware(self):
        naive_dt = datetime(2025, 3, 15, 10, 30, 0)
        info = self._make_expanded_application_info(naive_dt)
        assert info.received_date_time is not None
        assert info.received_date_time.tzinfo is not None
        assert info.received_date_time.tzinfo == zoneinfo.ZoneInfo("US/Eastern")

    def test_aware_datetime_is_not_modified(self):
        utc_tz = zoneinfo.ZoneInfo("UTC")
        aware_dt = datetime(2025, 3, 15, 10, 30, 0, tzinfo=utc_tz)
        info = self._make_expanded_application_info(aware_dt)
        assert info.received_date_time is not None
        assert info.received_date_time.tzinfo == utc_tz

    def test_none_datetime_stays_none(self):
        info = self._make_expanded_application_info(None)
        assert info.received_date_time is None


class TestExpandedApplicationInfoDefaultNone:
    """ExpandedApplicationInfo fields default to None when keys are missing.
    CompetitionID is supported per the SOAP Proxy fields table; UEI is not.
    """

    def test_expanded_application_info_from_empty_dict(self):
        info = grantors_schemas.ExpandedApplicationInfo(**{})
        assert info.funding_opportunity_number is None
        assert info.cfda_number is None
        assert info.grants_gov_tracking_number is None
        assert info.received_date_time is None
        assert info.grants_gov_application_status is None
        assert info.submission_method is None
        assert info.submission_title is None
        assert info.package_id is None
        assert info.competition_id is None
        assert info.delinquent_federal_debt is None
        assert info.active_exclusions is None

    def test_expanded_application_info_includes_competition_id_but_not_uei(self):
        # CompetitionID is in the SOAP Proxy supported fields table; UEI is not.
        # transform_submission() returns both; UEI must be silently ignored.
        info = grantors_schemas.ExpandedApplicationInfo(
            **{"CompetitionID": "COMP-123", "UEI": "UEI-456", "PackageID": "PKG-001"}
        )
        assert info.package_id == "PKG-001"
        assert info.competition_id == "COMP-123"
        assert not hasattr(info, "uei")

    def test_expanded_application_info_with_partial_dict(self):
        info = grantors_schemas.ExpandedApplicationInfo(**{"PackageID": "00000000INDV"})
        assert info.package_id == "00000000INDV"
        assert info.cfda_number is None
        assert info.funding_opportunity_number is None

    def test_get_application_list_expanded_response_from_empty_dict(self):
        response = grantors_schemas.GetApplicationListExpandedResponse(**{})
        assert response.success is True
        assert response.available_application_number is None
        assert response.expanded_application_info == []
