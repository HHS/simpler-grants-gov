import zoneinfo
from datetime import datetime

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


class TestSubmissionInfoTimezoneValidation:
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
        "UEI": "ABC123",
    }

    def _make_submission_info(self, received_date_time):
        return grantors_schemas.SubmissionInfo(
            **{**self.SUBMISSION_DEFAULTS, "ns2:ReceivedDateTime": received_date_time}
        )

    def test_naive_datetime_is_made_timezone_aware(self):
        naive_dt = datetime(2025, 3, 15, 10, 30, 0)
        info = self._make_submission_info(naive_dt)
        assert info.received_date_time is not None
        assert info.received_date_time.tzinfo is not None
        assert info.received_date_time.tzinfo == zoneinfo.ZoneInfo("US/Eastern")

    def test_aware_datetime_is_not_modified(self):
        utc_tz = zoneinfo.ZoneInfo("UTC")
        aware_dt = datetime(2025, 3, 15, 10, 30, 0, tzinfo=utc_tz)
        info = self._make_submission_info(aware_dt)
        assert info.received_date_time is not None
        assert info.received_date_time.tzinfo == utc_tz

    def test_none_datetime_stays_none(self):
        info = self._make_submission_info(None)
        assert info.received_date_time is None

    def test_naive_and_aware_datetimes_can_be_sorted(self):
        naive_dt = datetime(2025, 3, 15, 10, 30, 0)
        eastern_tz = zoneinfo.ZoneInfo("US/Eastern")
        aware_dt = datetime(2025, 6, 1, 12, 0, 0, tzinfo=eastern_tz)
        info_naive = self._make_submission_info(naive_dt)
        info_aware = self._make_submission_info(aware_dt)
        # This should not raise TypeError
        sorted_info = sorted(
            [info_naive, info_aware],
            key=lambda x: x.received_date_time or datetime.min.replace(tzinfo=eastern_tz),
            reverse=True,
        )
        assert sorted_info[0].received_date_time == aware_dt


class TestSubmissionInfoDefaultNone:
    """Test that SubmissionInfo fields default to None when keys are missing from input."""

    def test_submission_info_from_empty_dict(self):
        info = grantors_schemas.SubmissionInfo(**{})
        assert info.funding_opportunity_number is None
        assert info.cfda_number is None
        assert info.grants_gov_tracking_number is None
        assert info.received_date_time is None
        assert info.grants_gov_application_status is None
        assert info.submission_method is None
        assert info.submission_title is None
        assert info.package_id is None
        assert info.delinquent_federal_debt is None
        assert info.active_exclusions is None
        assert info.uei is None

    def test_submission_info_with_partial_dict(self):
        info = grantors_schemas.SubmissionInfo(**{"UEI": "00000000INDV"})
        assert info.uei == "00000000INDV"
        assert info.cfda_number is None
        assert info.funding_opportunity_number is None

    def test_get_submission_list_expanded_response_from_empty_dict(self):
        response = grantors_schemas.GetSubmissionListExpandedResponse(**{})
        assert response.success is True
        assert response.available_application_number is None
        assert response.submission_info == []
