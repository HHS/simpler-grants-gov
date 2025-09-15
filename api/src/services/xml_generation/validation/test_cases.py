"""Sample test cases for XML validation against XSD schemas."""

from typing import Any

# Sample test cases for SF-424 validation
SF424_TEST_CASES = [
    {
        "name": "minimal_valid_sf424",
        "json_input": {
            "applicant_name": "Test Organization",
            "applicant_address": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC",
                "zip_postal_code": "20001",
                "country": "USA",
            },
            "applicant_type_code": ["A"],
            "application_type": "New",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative_name": "John Doe",
            "authorized_representative_title": "CEO",
            "authorized_representative_phone": "555-123-4567",
            "authorized_representative_email": "john@testorg.com",
            "date_signed": "2024-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "revision_application_sf424",
        "json_input": {
            "applicant_name": "Test Organization",
            "applicant_address": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC",
                "zip_postal_code": "20001",
                "country": "USA",
            },
            "applicant_type_code": ["A", "B"],
            "application_type": "Revision",
            "revision_type": "Other",
            "federal_award_identifier": "HHS-2024-001",
            "federal_estimated_funding": "150000.00",
            "applicant_estimated_funding": "25000.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative_name": "Jane Smith",
            "authorized_representative_title": "Director",
            "authorized_representative_phone": "555-987-6543",
            "authorized_representative_email": "jane@testorg.com",
            "date_signed": "2024-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "continuation_application_sf424",
        "json_input": {
            "applicant_name": "Test Organization",
            "applicant_address": {
                "street1": "456 Oak Ave",
                "city": "Washington",
                "state": "DC",
                "zip_postal_code": "20002",
                "country": "USA",
            },
            "applicant_type_code": ["A"],
            "application_type": "Continuation",
            "federal_award_identifier": "HHS-2023-002",
            "federal_estimated_funding": "200000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative_name": "Bob Johnson",
            "authorized_representative_title": "President",
            "authorized_representative_phone": "555-456-7890",
            "authorized_representative_email": "bob@testorg.com",
            "date_signed": "2024-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "with_debt_explanation_sf424",
        "json_input": {
            "applicant_name": "Test Organization",
            "applicant_address": {
                "street1": "789 Pine St",
                "city": "Washington",
                "state": "DC",
                "zip_postal_code": "20003",
                "country": "USA",
            },
            "applicant_type_code": ["A"],
            "application_type": "New",
            "federal_estimated_funding": "75000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "delinquent_federal_debt": True,
            "debt_explanation": "Previous debt has been resolved through payment plan",
            "certification_agree": True,
            "authorized_representative_name": "Alice Brown",
            "authorized_representative_title": "Executive Director",
            "authorized_representative_phone": "555-321-0987",
            "authorized_representative_email": "alice@testorg.com",
            "date_signed": "2024-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "multiple_applicant_types_sf424",
        "json_input": {
            "applicant_name": "Test Organization",
            "applicant_address": {
                "street1": "321 Elm St",
                "city": "Washington",
                "state": "DC",
                "zip_postal_code": "20004",
                "country": "USA",
            },
            "applicant_type_code": ["A", "B", "C"],
            "application_type": "New",
            "federal_estimated_funding": "300000.00",
            "applicant_estimated_funding": "50000.00",
            "state_estimated_funding": "25000.00",
            "local_estimated_funding": "10000.00",
            "other_estimated_funding": "15000.00",
            "program_income_estimated_funding": "0.00",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative_name": "Charlie Wilson",
            "authorized_representative_title": "Manager",
            "authorized_representative_phone": "555-654-3210",
            "authorized_representative_email": "charlie@testorg.com",
            "date_signed": "2024-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
]


def get_all_test_cases() -> list[dict[str, Any]]:
    """Get all available test cases.

    Returns:
        List of all test case dictionaries
    """
    return SF424_TEST_CASES


def get_test_cases_by_form(form_name: str) -> list[dict[str, Any]]:
    """Get test cases for a specific form.

    Args:
        form_name: The form name to filter by

    Returns:
        List of test case dictionaries for the specified form
    """
    all_cases = get_all_test_cases()
    return [case for case in all_cases if case.get("form_name") == form_name]
