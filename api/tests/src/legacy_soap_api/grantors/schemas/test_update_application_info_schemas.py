import unittest

import pytest
from pydantic import ValidationError

from src.legacy_soap_api.grantors.schemas.update_application_info_schemas import (
    UpdateApplicationInfoRequest,
    UpdateApplicationInfoResponse,
)


class TestUpdateApplicationInfoRequestSchema(unittest.TestCase):
    def setUp(self) -> None:
        self.update_application_info_request_dict = {
            "grants_gov_tracking_number": "GRANTS80193",
        }

    def test_minimal_valid_schema(self) -> None:
        assert isinstance(
            UpdateApplicationInfoRequest(**self.update_application_info_request_dict),
            UpdateApplicationInfoRequest,
        )

    def test_valid_schema_with_optional_fields(self) -> None:
        schema_dict = {
            **self.update_application_info_request_dict,
            "assign_agency_tracking_number": "GRANTS80193",
            "save_agency_notes": "agencynotesdata",
        }
        assert isinstance(UpdateApplicationInfoRequest(**schema_dict), UpdateApplicationInfoRequest)

    def test_missing_required_fields(self) -> None:
        with pytest.raises(ValidationError):
            UpdateApplicationInfoRequest(**{})

    def test_invalid_agency_notes_length(self) -> None:
        schema_dict = {
            **self.update_application_info_request_dict,
            "save_agency_notes": "",
        }
        with pytest.raises(ValidationError):
            UpdateApplicationInfoRequest(**schema_dict)


class TestUpdateApplicationInfoResponseSchema(unittest.TestCase):
    def setUp(self) -> None:
        self.update_application_info_response_dict = {
            "grants_gov_tracking_number": "GRANTS80193",
            "success": True,
        }

    def test_minimal_valid_schema(self) -> None:
        assert isinstance(
            UpdateApplicationInfoResponse(**self.update_application_info_response_dict),
            UpdateApplicationInfoResponse,
        )

    def test_valid_schema_with_optional_fields(self) -> None:
        schema_dict = {
            **self.update_application_info_response_dict,
            "assign_agency_tracking_number_result": {
                "success": True,
            },
            "save_agency_notes_result": {
                "success": True,
            },
        }
        assert isinstance(
            UpdateApplicationInfoResponse(**schema_dict), UpdateApplicationInfoResponse
        )

    def test_missing_success_fields(self) -> None:
        with pytest.raises(ValidationError):
            UpdateApplicationInfoResponse(**{"grants_gov_tracking_number": "GRANTS80193"})
