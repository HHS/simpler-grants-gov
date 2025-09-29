#!/usr/bin/env python3
"""
XML Validation Tool - Tests JSON to XML conversion with static test cases.

This tool validates that JSON application data is correctly converted to XML
according to the configured transformation rules. It's form-agnostic and can
be extended to support multiple forms.
"""

import json
import sys
from typing import Any

# Add the src directory to Python path for imports
sys.path.insert(0, "../src")

from src.services.xml_generation.models import XMLGenerationRequest
from src.services.xml_generation.service import XMLGenerationService

# Define static test cases for SF-424 4.0
SF424_4_0_MINIMAL_JSON: dict[str, Any] = {
    "submission_type": "Application",
    "organization_name": "Test Organization",
    "applicant_type_code": ["A: State Government"],
}

SF424_4_0_MINIMAL_XML_EXPECTED_ELEMENTS = [
    "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>",
    "<SF424_4_0:OrganizationName>Test Organization</SF424_4_0:OrganizationName>",
    "<SF424_4_0:ApplicantTypeCode1>A: State Government</SF424_4_0:ApplicantTypeCode1>",
]

SF424_4_0_FULL_JSON: dict[str, Any] = {
    "submission_type": "Application",
    "application_type": "New",
    "date_received": "2025-01-15",
    "organization_name": "Example Organization",
    "employer_taxpayer_identification_number": "123456789",
    "sam_uei": "TEST12345678",
    "applicant_address": {
        "street1": "123 Main Street",
        "street2": "Suite 100",
        "city": "Washington",
        "county": "District of Columbia",
        "state": "DC: District of Columbia",
        "zip_postal_code": "20001-1234",
        "country": "USA: UNITED STATES",
    },
    "phone_number": "555-123-4567",
    "email": "test@example.org",
    "applicant_type_code": ["A: State Government"],
    "agency_name": "Test Agency",
    "funding_opportunity_number": "TEST-FON-2024-001",
    "funding_opportunity_title": "Test Funding Opportunity",
    "project_title": "Example Project with Configurable Namespaces",
    "congressional_district_applicant": "DC-00",
    "congressional_district_program_project": "DC-00",
    "project_start_date": "2025-04-01",
    "project_end_date": "2026-03-31",
    "federal_estimated_funding": "100000.00",
    "applicant_estimated_funding": "0.00",
    "state_estimated_funding": "0.00",
    "local_estimated_funding": "0.00",
    "other_estimated_funding": "0.00",
    "program_income_estimated_funding": "0.00",
    "total_estimated_funding": "100000.00",
    "state_review": "c. Program is not covered by E.O. 12372.",
    "delinquent_federal_debt": False,
    "certification_agree": True,
    "authorized_representative": {"first_name": "John", "last_name": "Doe"},
    "authorized_representative_title": "CEO",
    "authorized_representative_phone_number": "555-123-4567",
    "authorized_representative_email": "john@example.org",
    "aor_signature": "John Doe Signature",
    "date_signed": "2025-01-15",
}

SF424_4_0_FULL_XML_EXPECTED_ELEMENTS = [
    "<SF424_4_0:SubmissionType>Application</SF424_4_0:SubmissionType>",
    "<SF424_4_0:ApplicationType>New</SF424_4_0:ApplicationType>",
    "<SF424_4_0:OrganizationName>Example Organization</SF424_4_0:OrganizationName>",
    "<globLib:Street1>123 Main Street</globLib:Street1>",
    "<globLib:City>Washington</globLib:City>",
    "<globLib:State>DC: District of Columbia</globLib:State>",
    "<SF424_4_0:ProjectTitle>Example Project with Configurable Namespaces</SF424_4_0:ProjectTitle>",
    "<SF424_4_0:FederalEstimatedFunding>100000.00</SF424_4_0:FederalEstimatedFunding>",
    "<globLib:FirstName>John</globLib:FirstName>",
    "<globLib:LastName>Doe</globLib:LastName>",
]


class XmlValidator:
    """Validates JSON to XML conversion with static test cases."""

    def __init__(self) -> None:
        """Initialize the validator."""
        self.tests_run = 0
        self.tests_failed = 0
        self.service = XMLGenerationService()

    def validate_json_to_xml(
        self,
        scenario_name: str,
        json_data: dict[str, Any],
        expected_elements: list[str],
        form: str = "SF424_4_0",
    ) -> None:
        """Validate that JSON converts to XML with expected elements.

        Args:
            scenario_name: Name of the test scenario
            json_data: Input JSON application data
            expected_elements: List of XML elements/patterns expected in output
            form: Form name/version (default: SF424_4_0)
        """
        self.tests_run += 1
        print(f"\n{'='*70}")
        print(f"Running: {scenario_name}")
        print(f"{'='*70}")

        try:
            # Generate XML
            request = XMLGenerationRequest(
                application_data=json_data,
                form_name=form,
                pretty_print=True,
            )
            response = self.service.generate_xml(request)

            if not response.success:
                print(f"❌ FAILED: XML generation error: {response.error_message}")
                self.tests_failed += 1
                return

            xml_output = response.xml_data or ""

            # Validate expected elements are present
            missing_elements = []
            for expected in expected_elements:
                if expected not in xml_output:
                    missing_elements.append(expected)

            if missing_elements:
                print(f"❌ FAILED: Missing expected XML elements:")
                for element in missing_elements:
                    print(f"  - {element}")
                print(f"\nGenerated XML:\n{xml_output}")
                self.tests_failed += 1
            else:
                print(f"✅ PASSED: All expected elements found")
                print(f"\nGenerated XML preview (first 500 chars):")
                print(xml_output[:500] + "...")

        except Exception as e:
            print(f"❌ FAILED: Unexpected error: {e}")
            self.tests_failed += 1

    def print_summary(self) -> None:
        """Print test execution summary."""
        print(f"\n{'='*70}")
        print(f"Test Summary")
        print(f"{'='*70}")
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_run - self.tests_failed}")
        print(f"Tests failed: {self.tests_failed}")
        if self.tests_failed == 0:
            print(f"\n✅ All tests passed!")
        else:
            print(f"\n❌ {self.tests_failed} test(s) failed")


def run() -> int:
    """Run all validation tests.

    Returns:
        Exit code (0 for success, 1 for failure)
    """
    print("XML Generation Validation Tool")
    print("Testing JSON to XML conversion with static test cases\n")

    validator = XmlValidator()

    # Run SF-424 4.0 tests
    validator.validate_json_to_xml(
        "SF-424 4.0 - Minimal JSON",
        SF424_4_0_MINIMAL_JSON,
        SF424_4_0_MINIMAL_XML_EXPECTED_ELEMENTS,
        "SF424_4_0",
    )

    validator.validate_json_to_xml(
        "SF-424 4.0 - Full JSON with all fields",
        SF424_4_0_FULL_JSON,
        SF424_4_0_FULL_XML_EXPECTED_ELEMENTS,
        "SF424_4_0",
    )

    # Print summary
    validator.print_summary()

    # Return exit code
    return 1 if validator.tests_failed > 0 else 0


if __name__ == "__main__":
    sys.exit(run())
