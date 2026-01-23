"""Sample test cases for XML validation against XSD schemas."""

from typing import Any

# Sample test cases for SF-424 validation
SF424_TEST_CASES = [
    {
        "name": "minimal_valid_sf424",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
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
            "authorized_representative_email": "john@testorg.com",
            "aor_signature": "John Doe Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "revision_application_sf424",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government", "B: County Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "revision_type": "Other",
            "federal_award_identifier": "HHS-2025-001",
            "federal_estimated_funding": "150000.00",
            "applicant_estimated_funding": "25000.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "175000.00",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "Director",
            "authorized_representative_phone_number": "555-987-6543",
            "authorized_representative_email": "jane@testorg.com",
            "aor_signature": "Jane Smith Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "continuation_application_sf424",
        "json_input": {
            "submission_type": "Application",
            "application_type": "Continuation",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "456 Oak Ave",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20002",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "federal_award_identifier": "HHS-2023-002",
            "federal_estimated_funding": "200000.00",
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
            "authorized_representative_name": "Bob Johnson",
            "authorized_representative_title": "President",
            "authorized_representative_phone_number": "555-456-7890",
            "authorized_representative_email": "bob@testorg.com",
            "aor_signature": "Bob Johnson Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "multiple_applicant_types_sf424",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "321 Elm St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20004",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": [
                "A: State Government",
                "B: County Government",
                "C: City or Township Government",
            ],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "federal_estimated_funding": "300000.00",
            "applicant_estimated_funding": "50000.00",
            "state_estimated_funding": "25000.00",
            "local_estimated_funding": "10000.00",
            "other_estimated_funding": "15000.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "100000.00",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": False,
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_name": "Charlie Wilson",
            "authorized_representative_title": "Manager",
            "authorized_representative_phone_number": "555-654-3210",
            "authorized_representative_email": "charlie@testorg.com",
            "aor_signature": "Charlie Wilson Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424_with_single_attachment",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "100000.00",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": True,
            "debt_explanation": "11111111-1111-1111-1111-111111111111",  # UUID reference
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "CEO",
            "authorized_representative_phone_number": "555-123-4567",
            "authorized_representative_email": "john@testorg.com",
            "aor_signature": "John Doe Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
        "attachment_mapping": {
            "11111111-1111-1111-1111-111111111111": {
                "FileName": "debt_explanation.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/debt_explanation.pdf"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "aGVsbG8gd29ybGQxMjM0NTY3ODk=",
                },
            }
        },
    },
    {
        "name": "sf424_with_multiple_attachments",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "100000.00",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": False,
            "additional_project_title": [
                "22222222-2222-2222-2222-222222222222",
                "33333333-3333-3333-3333-333333333333",
            ],
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "CEO",
            "authorized_representative_phone_number": "555-123-4567",
            "authorized_representative_email": "john@testorg.com",
            "aor_signature": "John Doe Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
        "attachment_mapping": {
            "22222222-2222-2222-2222-222222222222": {
                "FileName": "project_description.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/project_description.pdf"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "cHJvamVjdERlc2NyaXB0aW9uSGFzaA==",
                },
            },
            "33333333-3333-3333-3333-333333333333": {
                "FileName": "project_timeline.xlsx",
                "MimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "FileLocation": {"@href": "./attachments/project_timeline.xlsx"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "cHJvamVjdFRpbWVsaW5lSGFzaA==",
                },
            },
        },
    },
    {
        "name": "sf424_with_all_attachment_types",
        "json_input": {
            "submission_type": "Application",
            "application_type": "New",
            "date_received": "2024-01-01",
            "organization_name": "Test Organization",
            "employer_taxpayer_identification_number": "123456789",
            "sam_uei": "TEST12345678",
            "applicant": {
                "street1": "123 Main St",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
                "country": "USA: UNITED STATES",
            },
            "phone_number": "555-123-4567",
            "email": "test@example.org",
            "applicant_type_code": ["A: State Government"],
            "agency_name": "Test Agency",
            "funding_opportunity_number": "TEST-FON-2024-001",
            "funding_opportunity_title": "Test Funding Opportunity",
            "project_title": "Test Project Title",
            "congressional_district_applicant": "DC-00",
            "congressional_district_program_project": "DC-00",
            "additional_congressional_districts": "44444444-4444-4444-4444-444444444444",
            "project_start_date": "2024-04-01",
            "project_end_date": "2025-03-31",
            "federal_estimated_funding": "100000.00",
            "applicant_estimated_funding": "0.00",
            "state_estimated_funding": "0.00",
            "local_estimated_funding": "0.00",
            "other_estimated_funding": "0.00",
            "program_income_estimated_funding": "0.00",
            "total_estimated_funding": "100000.00",
            "areas_affected": "55555555-5555-5555-5555-555555555555",
            "state_review": "c. Program is not covered by E.O. 12372.",
            "delinquent_federal_debt": True,
            "debt_explanation": "66666666-6666-6666-6666-666666666666",
            "additional_project_title": [
                "77777777-7777-7777-7777-777777777777",
                "88888888-8888-8888-8888-888888888888",
                "99999999-9999-9999-9999-999999999999",
            ],
            "certification_agree": True,
            "authorized_representative": {"first_name": "John", "last_name": "Doe"},
            "authorized_representative_title": "CEO",
            "authorized_representative_phone_number": "555-123-4567",
            "authorized_representative_email": "john@testorg.com",
            "aor_signature": "John Doe Signature",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424_4_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424_4_0-V4.0.xsd",
        "pretty_print": True,
        "attachment_mapping": {
            "44444444-4444-4444-4444-444444444444": {
                "FileName": "additional_districts.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/additional_districts.pdf"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "YWRkaXRpb25hbERpc3RyaWN0c0hhc2g=",
                },
            },
            "55555555-5555-5555-5555-555555555555": {
                "FileName": "geographic_areas.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/geographic_areas.pdf"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "Z2VvZ3JhcGhpY0FyZWFzSGFzaA==",
                },
            },
            "66666666-6666-6666-6666-666666666666": {
                "FileName": "debt_explanation_detailed.docx",
                "MimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "FileLocation": {"@href": "./attachments/debt_explanation_detailed.docx"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "ZGVidEV4cGxhbmF0aW9uSGFzaA==",
                },
            },
            "77777777-7777-7777-7777-777777777777": {
                "FileName": "project_overview.pdf",
                "MimeType": "application/pdf",
                "FileLocation": {"@href": "./attachments/project_overview.pdf"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "cHJvamVjdE92ZXJ2aWV3SGFzaA==",
                },
            },
            "88888888-8888-8888-8888-888888888888": {
                "FileName": "project_budget.xlsx",
                "MimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "FileLocation": {"@href": "./attachments/project_budget.xlsx"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "cHJvamVjdEJ1ZGdldEhhc2g=",
                },
            },
            "99999999-9999-9999-9999-999999999999": {
                "FileName": "project_partners.txt",
                "MimeType": "text/plain",
                "FileLocation": {"@href": "./attachments/project_partners.txt"},
                "HashValue": {
                    "@hashAlgorithm": "SHA-1",
                    "#text": "cHJvamVjdFBhcnRuZXJzSGFzaA==",
                },
            },
        },
    },
]

# Sample test cases for SF-424A validation
SF424A_TEST_CASES = [
    {
        "name": "sf424a_minimal_non_federal_resources_only",
        "json_input": {
            # Minimal required fields for XSD validation
            "program_type": "Non-Construction",
            "form_version_identifier": "1.0",
            # Just the NonFederalResources section to validate
            "activity_line_items": [
                {
                    "activity_title": "Line 1",
                    "non_federal_resources": {
                        "applicant_amount": "10.00",
                        "state_amount": "20.00",
                        "other_amount": "30.00",
                        "total_amount": "60.00",
                    },
                },
            ],
            "total_non_federal_resources": {
                "applicant_amount": "120.00",
                "state_amount": "150.00",
                "other_amount": "180.00",
                "total_amount": "450.00",
            },
        },
        "form_name": "SF424A",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424a_budget_sections_with_array_decomposition",
        "json_input": {
            # Required fields
            "program_type": "Non-Construction",
            "form_version_identifier": "1.0",
            "activity_line_items": [
                {
                    "activity_title": "Line 1",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "10.00",
                        "total_new_or_revised_amount": "60.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "20.00",
                    },
                    "non_federal_resources": {
                        "applicant_amount": "10.00",
                        "state_amount": "20.00",
                        "other_amount": "30.00",
                        "total_amount": "60.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "60.00",
                    },
                },
                {
                    "activity_title": "Line 2",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "30.00",
                        "total_new_or_revised_amount": "90.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "40.00",
                    },
                    "non_federal_resources": {
                        "applicant_amount": "30.00",
                        "state_amount": "40.00",
                        "other_amount": "20.00",
                        "total_amount": "90.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "90.00",
                    },
                },
            ],
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "40.00",
                "total_new_or_revised_amount": "150.00",
            },
            "total_budget_categories": {
                "personnel_amount": "60.00",
            },
            "total_non_federal_resources": {
                "applicant_amount": "120.00",
                "state_amount": "150.00",
                "other_amount": "180.00",
                "total_amount": "450.00",
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "150.00",
            },
        },
        "form_name": "SF424A",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424a_with_forecasted_cash_needs",
        "json_input": {
            # Required fields
            "program_type": "Non-Construction",
            "form_version_identifier": "1.0",
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "25000.00",
                    "second_quarter_amount": "25000.00",
                    "third_quarter_amount": "25000.00",
                    "fourth_quarter_amount": "25000.00",
                    "total_amount": "100000.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "5000.00",
                    "second_quarter_amount": "5000.00",
                    "third_quarter_amount": "5000.00",
                    "fourth_quarter_amount": "5000.00",
                    "total_amount": "20000.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "30000.00",
                    "second_quarter_amount": "30000.00",
                    "third_quarter_amount": "30000.00",
                    "fourth_quarter_amount": "30000.00",
                    "total_amount": "120000.00",
                },
            },
            "activity_line_items": [
                {
                    "activity_title": "Research Activities",
                    "budget_summary": {
                        "federal_estimated_unobligated_amount": "5000.00",
                        "total_new_or_revised_amount": "50000.00",
                    },
                    "budget_categories": {
                        "personnel_amount": "30000.00",
                        "fringe_benefits_amount": "10000.00",
                        "travel_amount": "5000.00",
                        "equipment_amount": "0.00",
                        "supplies_amount": "3000.00",
                        "contractual_amount": "2000.00",
                        "construction_amount": "0.00",
                        # Note: other_amount omitted - would need BudgetOtherRequestedAmount (not BudgetOtherContributionAmount)
                        # Note: total_amount not valid for CategorySet line items per XSD
                    },
                    "non_federal_resources": {
                        "applicant_amount": "10000.00",
                        "state_amount": "5000.00",
                        "other_amount": "5000.00",
                        "total_amount": "20000.00",
                    },
                    "federal_fund_estimates": {
                        "first_year_amount": "50000.00",
                        "second_year_amount": "0.00",
                        "third_year_amount": "0.00",
                        "fourth_year_amount": "0.00",
                    },
                },
            ],
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "5000.00",
                "total_new_or_revised_amount": "50000.00",
            },
            "total_budget_categories": {
                "personnel_amount": "30000.00",
                "fringe_benefits_amount": "10000.00",
                "travel_amount": "5000.00",
                "equipment_amount": "0.00",
                "supplies_amount": "3000.00",
                "contractual_amount": "2000.00",
                "construction_amount": "0.00",
                # Note: other_amount omitted - would need BudgetOtherRequestedAmount
                # Note: total_amount not valid for CategoryTotals per XSD
            },
            "total_non_federal_resources": {
                "applicant_amount": "10000.00",
                "state_amount": "5000.00",
                "other_amount": "5000.00",
                "total_amount": "20000.00",
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "50000.00",
                "second_year_amount": "0.00",
                "third_year_amount": "0.00",
                "fourth_year_amount": "0.00",
            },
        },
        "form_name": "SF424A",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424a_complete_all_sections",
        "json_input": {
            # Required fields
            "program_type": "Non-Construction",
            "form_version_identifier": "1.0",
            # Activity line items with all sections
            "activity_line_items": [
                {
                    "activity_title": "Personnel and Training",
                    # Section A - Budget Summary
                    "budget_summary": {
                        "assistance_listing_number": "93.001",  # CFDANumber - child element per XSD
                        "federal_estimated_unobligated_amount": "1000.00",
                        "non_federal_estimated_unobligated_amount": "500.00",
                        "federal_new_or_revised_amount": "50000.00",
                        "non_federal_new_or_revised_amount": "10000.00",
                        "total_new_or_revised_amount": "61500.00",
                    },
                    # Section B - Budget Categories
                    "budget_categories": {
                        "personnel_amount": "30000.00",
                        "fringe_benefits_amount": "8000.00",
                        "travel_amount": "5000.00",
                        "equipment_amount": "3000.00",
                        "supplies_amount": "2000.00",
                        "contractual_amount": "0.00",
                        "construction_amount": "0.00",
                        # Note: other_amount omitted - would need BudgetOtherRequestedAmount
                        "total_direct_charge_amount": "49000.00",
                        "total_indirect_charge_amount": "2000.00",
                        # Note: total_amount not valid for CategorySet per XSD
                        "program_income_amount": "500.00",
                    },
                    # Section C - Non-Federal Resources
                    "non_federal_resources": {
                        "applicant_amount": "5000.00",
                        "state_amount": "3000.00",
                        "other_amount": "2000.00",
                        "total_amount": "10000.00",
                    },
                    # Section E - Federal Funds Needed
                    "federal_fund_estimates": {
                        "first_year_amount": "50000.00",
                        "second_year_amount": "0.00",
                        "third_year_amount": "0.00",
                        "fourth_year_amount": "0.00",
                    },
                },
            ],
            # Totals
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "1000.00",
                "non_federal_estimated_unobligated_amount": "500.00",
                "federal_new_or_revised_amount": "50000.00",
                "non_federal_new_or_revised_amount": "10000.00",
                "total_new_or_revised_amount": "61500.00",
            },
            "total_budget_categories": {
                "personnel_amount": "30000.00",
                "fringe_benefits_amount": "8000.00",
                "travel_amount": "5000.00",
                "equipment_amount": "3000.00",
                "supplies_amount": "2000.00",
                "contractual_amount": "0.00",
                "construction_amount": "0.00",
                # Note: other_amount omitted - would need BudgetOtherRequestedAmount
                "total_direct_charge_amount": "49000.00",
                "total_indirect_charge_amount": "2000.00",
                # Note: total_amount not valid for CategoryTotals per XSD
                "program_income_amount": "500.00",
            },
            "total_non_federal_resources": {
                "applicant_amount": "5000.00",
                "state_amount": "3000.00",
                "other_amount": "2000.00",
                "total_amount": "10000.00",
            },
            # Section D - Forecasted Cash Needs
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "12500.00",
                    "second_quarter_amount": "12500.00",
                    "third_quarter_amount": "12500.00",
                    "fourth_quarter_amount": "12500.00",
                    "total_amount": "50000.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "2500.00",
                    "second_quarter_amount": "2500.00",
                    "third_quarter_amount": "2500.00",
                    "fourth_quarter_amount": "2500.00",
                    "total_amount": "10000.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "15000.00",
                    "second_quarter_amount": "15000.00",
                    "third_quarter_amount": "15000.00",
                    "fourth_quarter_amount": "15000.00",
                    "total_amount": "60000.00",
                },
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "50000.00",
                "second_year_amount": "0.00",
                "third_year_amount": "0.00",
                "fourth_year_amount": "0.00",
            },
            # Section F - Other Information
            "other_information": {
                "direct_charges_explanation": "Equipment costs for lab instruments",
                "indirect_charges_explanation": "10% indirect rate on direct costs",
                "remarks": "This budget supports a 12-month research project",
            },
        },
        "form_name": "SF424A",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424a_complete_all_sections",
        "json_input": {
            # Required fields
            "program_type": "Non-Construction",
            "form_version_identifier": "1.0",
            # Activity line items with all sections
            "activity_line_items": [
                {
                    "activity_title": "Personnel and Training",
                    # Section A - Budget Summary
                    "budget_summary": {
                        "assistance_listing_number": "93.001",  # CFDANumber - child element per XSD
                        "federal_estimated_unobligated_amount": "1000.00",
                        "non_federal_estimated_unobligated_amount": "500.00",
                        "federal_new_or_revised_amount": "50000.00",
                        "non_federal_new_or_revised_amount": "10000.00",
                        "total_new_or_revised_amount": "61500.00",
                    },
                    # Section B - Budget Categories
                    "budget_categories": {
                        "personnel_amount": "30000.00",
                        "fringe_benefits_amount": "8000.00",
                        "travel_amount": "5000.00",
                        "equipment_amount": "3000.00",
                        "supplies_amount": "2000.00",
                        "contractual_amount": "0.00",
                        "construction_amount": "0.00",
                        # Note: other_amount omitted - would need BudgetOtherRequestedAmount
                        "total_direct_charge_amount": "49000.00",
                        "total_indirect_charge_amount": "2000.00",
                        # Note: total_amount not valid for CategorySet per XSD
                        "program_income_amount": "500.00",
                    },
                    # Section C - Non-Federal Resources
                    "non_federal_resources": {
                        "applicant_amount": "5000.00",
                        "state_amount": "3000.00",
                        "other_amount": "2000.00",
                        "total_amount": "10000.00",
                    },
                    # Section E - Federal Funds Needed
                    "federal_fund_estimates": {
                        "first_year_amount": "50000.00",
                        "second_year_amount": "0.00",
                        "third_year_amount": "0.00",
                        "fourth_year_amount": "0.00",
                    },
                },
            ],
            # Totals
            "total_budget_summary": {
                "federal_estimated_unobligated_amount": "1000.00",
                "non_federal_estimated_unobligated_amount": "500.00",
                "federal_new_or_revised_amount": "50000.00",
                "non_federal_new_or_revised_amount": "10000.00",
                "total_new_or_revised_amount": "61500.00",
            },
            "total_budget_categories": {
                "personnel_amount": "30000.00",
                "fringe_benefits_amount": "8000.00",
                "travel_amount": "5000.00",
                "equipment_amount": "3000.00",
                "supplies_amount": "2000.00",
                "contractual_amount": "0.00",
                "construction_amount": "0.00",
                # Note: other_amount omitted - would need BudgetOtherRequestedAmount
                "total_direct_charge_amount": "49000.00",
                "total_indirect_charge_amount": "2000.00",
                # Note: total_amount not valid for CategoryTotals per XSD
                "program_income_amount": "500.00",
            },
            "total_non_federal_resources": {
                "applicant_amount": "5000.00",
                "state_amount": "3000.00",
                "other_amount": "2000.00",
                "total_amount": "10000.00",
            },
            # Section D - Forecasted Cash Needs
            "forecasted_cash_needs": {
                "federal_forecasted_cash_needs": {
                    "first_quarter_amount": "12500.00",
                    "second_quarter_amount": "12500.00",
                    "third_quarter_amount": "12500.00",
                    "fourth_quarter_amount": "12500.00",
                    "total_amount": "50000.00",
                },
                "non_federal_forecasted_cash_needs": {
                    "first_quarter_amount": "2500.00",
                    "second_quarter_amount": "2500.00",
                    "third_quarter_amount": "2500.00",
                    "fourth_quarter_amount": "2500.00",
                    "total_amount": "10000.00",
                },
                "total_forecasted_cash_needs": {
                    "first_quarter_amount": "15000.00",
                    "second_quarter_amount": "15000.00",
                    "third_quarter_amount": "15000.00",
                    "fourth_quarter_amount": "15000.00",
                    "total_amount": "60000.00",
                },
            },
            "total_federal_fund_estimates": {
                "first_year_amount": "50000.00",
                "second_year_amount": "0.00",
                "third_year_amount": "0.00",
                "fourth_year_amount": "0.00",
            },
            # Section F - Other Information
            "other_information": {
                "direct_charges_explanation": "Equipment costs for lab instruments",
                "indirect_charges_explanation": "10% indirect rate on direct costs",
                "remarks": "This budget supports a 12-month research project",
            },
        },
        "form_name": "SF424A",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424A-V1.0.xsd",
        "pretty_print": True,
    },
]

# Sample test cases for EPA Form 4700-4 validation
EPA4700_4_TEST_CASES = [
    {
        "name": "minimal_valid_epa4700_4",
        "json_input": {
            "applicant_name": "Test University",
            "applicant_address": {
                "address": "123 Main Street",
                "city": "Washington",
                "state": "DC: District of Columbia",
                "zip_code": "20001",
            },
            "sam_uei": "TEST12345678",
            "point_of_contact_name": "John Doe",
            "point_of_contact_phone_number": "555-123-4567",
            "point_of_contact_email": "john.doe@test.edu",
            "point_of_contact_title": "Director",
            "applicant_signature": {
                "aor_signature": "John Doe Signature",
                "aor_title": "Director",
                "submitted_date": "2025-01-15",
            },
        },
        "form_name": "EPA4700_4",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "complete_epa4700_4_with_all_fields",
        "json_input": {
            "applicant_name": "Environmental Research Institute",
            "applicant_address": {
                "address": "456 Green Boulevard, Suite 200",
                "city": "Arlington",
                "state": "VA: Virginia",
                "zip_code": "22202",
            },
            "sam_uei": "ENVR98765432",
            "point_of_contact_name": "Jane Smith",
            "point_of_contact_phone_number": "555-987-6543",
            "point_of_contact_email": "jane.smith@envresearch.org",
            "point_of_contact_title": "Program Manager",
            "federal_financial_assistance": True,
            "civil_rights_lawsuit_question1": "No pending lawsuits or administrative complaints.",
            "civil_rights_lawsuit_question2": "No civil rights lawsuits decided against the applicant in the last year.",
            "civil_rights_lawsuit_question3": "One compliance review conducted by DOJ in 2023, resulting in no findings. Copy of review attached.",
            "construction_federal_assistance": True,
            "construction_new_facilities": True,
            "notice1": True,
            "notice2": True,
            "notice3": True,
            "notice4": True,
            "demographic_data": True,
            "policy": True,
            "policy_explanation": "Civil Rights Coordinator: Maria Garcia, Title: Compliance Officer, Address: 456 Green Blvd, Arlington VA 22202, Email: compliance@envresearch.org, Phone: 555-987-6544",
            "program_explanation": "Grievance procedures are available at https://envresearch.org/civil-rights-grievance or by contacting the Civil Rights Coordinator listed above.",
            "applicant_signature": {
                "aor_signature": "Jane Smith Signature",
                "aor_title": "Executive Director",
                "submitted_date": "2025-01-20",
            },
        },
        "form_name": "EPA4700_4",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "epa4700_4_with_construction_explanation",
        "json_input": {
            "applicant_name": "City of Springfield",
            "applicant_address": {
                "address": "100 City Hall Plaza",
                "city": "Springfield",
                "state": "IL: Illinois",
                "zip_code": "62701",
            },
            "sam_uei": "CITY12345678",
            "point_of_contact_name": "Robert Johnson",
            "point_of_contact_phone_number": "555-111-2222",
            "point_of_contact_email": "r.johnson@springfield.gov",
            "point_of_contact_title": "City Engineer",
            "federal_financial_assistance": False,
            "construction_federal_assistance": True,
            "construction_new_facilities": False,
            "construction_new_facilities_explanation": "The project involves renovation of an existing water treatment facility built in 1975. Due to the historic nature of the building and structural constraints, full accessibility modifications would compromise the building's structural integrity per 40 C.F.R. 7.70(b).",
            "notice1": True,
            "demographic_data": False,
            "policy": False,
            "applicant_signature": {
                "aor_signature": "Robert Johnson Signature",
                "aor_title": "City Engineer",
                "submitted_date": "2025-01-18",
            },
        },
        "form_name": "EPA4700_4",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA4700_4_5_0-V5.0.xsd",
        "pretty_print": True,
    },
]


# Sample test cases for SF-LLL validation
SFLLL_TEST_CASES = [
    {
        "name": "minimal_valid_sflll_initial_filing_prime",
        "json_input": {
            "federal_action_type": "Grant",
            "federal_action_status": "InitialAward",
            "report_type": "InitialFiling",
            "reporting_entity": {
                "entity_type": "Prime",
                "applicant_reporting_entity": {
                    "entity_type": "Prime",
                    "organization_name": "Test Research Institute",
                    "address": {
                        "street1": "456 Science Drive",
                        "city": "Bethesda",
                        "state": "MD: Maryland",
                        "zip_code": "20814",
                    },
                    "congressional_district": "MD-008",
                },
            },
            "federal_agency_department": "Department of Health and Human Services",
            "federal_program_name": "Research Grant Program",
            "assistance_listing_number": "93.123",
            "federal_action_number": "5R01GM123456-01",
            "award_amount": "500000.00",
            "lobbying_registrant": {
                "individual": {
                    "first_name": "John",
                    "last_name": "Smith",
                },
                "address": {
                    "street1": "789 K Street NW",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20001",
                },
            },
            "individual_performing_service": {
                "individual": {
                    "name": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                    },
                    "address": {
                        "street1": "100 Lobby Lane",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20002",
                    },
                },
            },
            "signature_block": {
                "name": {
                    "first_name": "Alice",
                    "last_name": "Johnson",
                },
                "title": "Chief Financial Officer",
                "telephone": "301-555-1234",
                "signed_date": "2025-01-15",
                "signature": "Alice Johnson Signature",
            },
        },
        "form_name": "SFLLL_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sflll_material_change",
        "json_input": {
            "federal_action_type": "Grant",
            "federal_action_status": "PostAward",
            "report_type": "MaterialChange",
            "material_change_year": "2024",
            "material_change_quarter": 3,
            "last_report_date": "2024-06-30",
            "reporting_entity": {
                "entity_type": "Prime",
                "applicant_reporting_entity": {
                    "entity_type": "Prime",
                    "organization_name": "University Research Foundation",
                    "address": {
                        "street1": "1000 University Boulevard",
                        "city": "College Park",
                        "state": "MD: Maryland",
                        "zip_code": "20742",
                    },
                    "congressional_district": "MD-004",
                },
            },
            "federal_agency_department": "National Science Foundation",
            "federal_program_name": "Advanced Computing Research",
            "assistance_listing_number": "47.070",
            "federal_action_number": "NSF-2024-12345",
            "award_amount": "750000.00",
            "lobbying_registrant": {
                "individual": {
                    "prefix": "Mr.",
                    "first_name": "Robert",
                    "middle_name": "J",
                    "last_name": "Williams",
                    "suffix": "Jr.",
                },
                "address": {
                    "street1": "500 Capitol Street",
                    "street2": "Suite 200",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20003",
                },
            },
            "individual_performing_service": {
                "individual": {
                    "name": {
                        "prefix": "Ms.",
                        "first_name": "Sarah",
                        "middle_name": "M",
                        "last_name": "Davis",
                    },
                    "address": {
                        "street1": "200 M Street NW",
                        "street2": "Floor 5",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20037",
                    },
                },
            },
            "signature_block": {
                "name": {
                    "prefix": "Dr.",
                    "first_name": "Michael",
                    "middle_name": "A",
                    "last_name": "Thompson",
                    "suffix": "PhD",
                },
                "title": "Vice President for Research",
                "telephone": "301-555-9876",
                "signed_date": "2024-09-15",
                "signature": "Michael A Thompson Signature",
            },
        },
        "form_name": "SFLLL_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sflll_subawardee_with_prime",
        "json_input": {
            "federal_action_type": "CoopAgree",
            "federal_action_status": "InitialAward",
            "report_type": "InitialFiling",
            "reporting_entity": {
                "entity_type": "SubAwardee",
                "tier": 1,
                "applicant_reporting_entity": {
                    "entity_type": "SubAwardee",
                    "organization_name": "Small Research Company LLC",
                    "address": {
                        "street1": "123 Innovation Way",
                        "city": "Boston",
                        "state": "MA: Massachusetts",
                        "zip_code": "02101",
                    },
                    "congressional_district": "MA-007",
                },
                "prime_reporting_entity": {
                    "entity_type": "Prime",
                    "organization_name": "Major University System",
                    "address": {
                        "street1": "999 Academic Drive",
                        "city": "Cambridge",
                        "state": "MA: Massachusetts",
                        "zip_code": "02138",
                    },
                    "congressional_district": "MA-005",
                },
            },
            "federal_agency_department": "Department of Energy",
            "federal_program_name": "Clean Energy Innovation Program",
            "assistance_listing_number": "81.086",
            "federal_action_number": "DE-FOA-2025-001",
            "award_amount": "250000.00",
            "lobbying_registrant": {
                "individual": {
                    "first_name": "Patricia",
                    "last_name": "Martinez",
                },
                "address": {
                    "street1": "1500 Pennsylvania Avenue",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20004",
                },
            },
            "individual_performing_service": {
                "individual": {
                    "name": {
                        "first_name": "David",
                        "last_name": "Lee",
                    },
                    "address": {
                        "street1": "800 Connecticut Avenue",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20006",
                    },
                },
            },
            "signature_block": {
                "name": {
                    "first_name": "Jennifer",
                    "last_name": "Brown",
                },
                "title": "CEO",
                "telephone": "617-555-4321",
                "signed_date": "2025-01-20",
                "signature": "Jennifer Brown Signature",
            },
        },
        "form_name": "SFLLL_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "sflll_loan_guarantee",
        "json_input": {
            "federal_action_type": "LoanGuarantee",
            "federal_action_status": "BidOffer",
            "report_type": "InitialFiling",
            "reporting_entity": {
                "entity_type": "Prime",
                "applicant_reporting_entity": {
                    "entity_type": "Prime",
                    "organization_name": "Community Development Corporation",
                    "address": {
                        "street1": "555 Main Street",
                        "street2": "Building A",
                        "city": "Detroit",
                        "state": "MI: Michigan",
                        "zip_code": "48201",
                    },
                    "congressional_district": "MI-013",
                },
            },
            "federal_agency_department": "Dept of Housing and Urban Development",
            "federal_program_name": "Community Development Block Grant",
            "assistance_listing_number": "14.218",
            "federal_action_number": "HUD-CDBG-2025-001",
            "award_amount": "1000000.00",
            "lobbying_registrant": {
                "individual": {
                    "prefix": "Ms.",
                    "first_name": "Elizabeth",
                    "middle_name": "Anne",
                    "last_name": "Wilson",
                },
                "address": {
                    "street1": "2000 L Street NW",
                    "city": "Washington",
                    "state": "DC: District of Columbia",
                    "zip_code": "20036",
                },
            },
            "individual_performing_service": {
                "individual": {
                    "name": {
                        "prefix": "Mr.",
                        "first_name": "Thomas",
                        "middle_name": "R",
                        "last_name": "Anderson",
                        "suffix": "III",
                    },
                    "address": {
                        "street1": "1800 G Street NW",
                        "city": "Washington",
                        "state": "DC: District of Columbia",
                        "zip_code": "20006",
                    },
                },
            },
            "signature_block": {
                "name": {
                    "prefix": "Rev.",
                    "first_name": "James",
                    "last_name": "Taylor",
                },
                "title": "Executive Director",
                "telephone": "313-555-7890",
                "signed_date": "2025-01-18",
                "signature": "Rev James Taylor Signature",
            },
        },
        "form_name": "SFLLL_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SFLLL_2_0-V2.0.xsd",
        "pretty_print": True,
    },
]


# Sample test cases for SF-424B validation
SF424B_TEST_CASES = [
    {
        "name": "sf424b_complete_assurances",
        "json_input": {
            "signature": "John Smith",
            "title": "Executive Director",
            "applicant_organization": "Test Research Organization",
            "date_signed": "2025-01-15",
        },
        "form_name": "SF424B",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424b_university_example",
        "json_input": {
            "signature": "Dr. Jane Doe",
            "title": "Vice President for Research",
            "applicant_organization": "State University Research Foundation",
            "date_signed": "2025-02-20",
        },
        "form_name": "SF424B",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "sf424b_nonprofit_example",
        "json_input": {
            "signature": "Alice Johnson",
            "title": "Program Manager",
            "applicant_organization": "Community Health Foundation",
            "date_signed": "2025-03-01",
        },
        "form_name": "SF424B",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/SF424B-V1.1.xsd",
        "pretty_print": True,
    },
]


# Sample test cases for CD511 validation
CD511_TEST_CASES = [
    {
        "name": "minimal_valid_cd511_with_project_name",
        "json_input": {
            "applicant_name": "Test Research Organization",
            "project_name": "Research Study on Climate Change",
            "contact_person": {
                "first_name": "John",
                "last_name": "Smith",
            },
            "contact_person_title": "Principal Investigator",
            "signature": "John Smith",
            "submitted_date": "2025-01-15",
        },
        "form_name": "CD511",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "cd511_with_award_number",
        "json_input": {
            "applicant_name": "University of Testing",
            "award_number": "1R01GM123456-01",
            "contact_person": {
                "first_name": "Jane",
                "last_name": "Doe",
            },
            "contact_person_title": "Research Director",
            "signature": "Jane Doe",
            "submitted_date": "2025-02-20",
        },
        "form_name": "CD511",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "cd511_with_full_contact_name",
        "json_input": {
            "applicant_name": "National Institute of Science",
            "award_number": "AWD-2025-001",
            "project_name": "Advanced Research Project",
            "contact_person": {
                "prefix": "Dr.",
                "first_name": "Robert",
                "middle_name": "James",
                "last_name": "Williams",
                "suffix": "Jr.",
            },
            "contact_person_title": "Senior Scientist",
            "signature": "Robert J. Williams Jr.",
            "submitted_date": "2025-03-01",
        },
        "form_name": "CD511",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/CD511-V1.1.xsd",
        "pretty_print": True,
    },
]


# Sample test cases for GG_LobbyingForm validation
GG_LOBBYING_FORM_TEST_CASES = [
    {
        "name": "minimal_valid_gg_lobbying_form",
        "json_input": {
            "organization_name": "Test Research Organization",
            "authorized_representative_name": {
                "first_name": "John",
                "last_name": "Smith",
            },
            "authorized_representative_title": "Principal Investigator",
            "authorized_representative_signature": "John Smith",
            "submitted_date": "2025-01-15",
        },
        "form_name": "GG_LobbyingForm",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "gg_lobbying_form_with_full_name",
        "json_input": {
            "organization_name": "National Institute of Science",
            "authorized_representative_name": {
                "prefix": "Dr.",
                "first_name": "Robert",
                "middle_name": "James",
                "last_name": "Williams",
                "suffix": "Jr.",
            },
            "authorized_representative_title": "Senior Scientist",
            "authorized_representative_signature": "Robert J. Williams Jr.",
            "submitted_date": "2025-03-01",
        },
        "form_name": "GG_LobbyingForm",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd",
        "pretty_print": True,
    },
    {
        "name": "gg_lobbying_form_university_example",
        "json_input": {
            "organization_name": "State University Research Foundation",
            "authorized_representative_name": {
                "prefix": "Ms.",
                "first_name": "Sarah",
                "middle_name": "Elizabeth",
                "last_name": "Johnson",
            },
            "authorized_representative_title": "Director of Sponsored Programs",
            "authorized_representative_signature": "Sarah E. Johnson",
            "submitted_date": "2025-02-15",
        },
        "form_name": "GG_LobbyingForm",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd",
        "pretty_print": True,
    },
]


# Sample test cases for Project Abstract Summary validation
PROJECT_ABSTRACT_SUMMARY_TEST_CASES = [
    {
        "name": "project_abstract_summary_complete",
        "json_input": {
            "funding_opportunity_number": "HHS-2025-ACF-001",
            "assistance_listing_number": "93.001",
            "applicant_name": "National Health Research Institute",
            "project_title": "Community Health Improvement Initiative",
            "project_abstract": (
                "This project aims to improve health outcomes in underserved communities "
                "through targeted interventions, community engagement, and data-driven "
                "approaches to healthcare delivery."
            ),
        },
        "form_name": "Project_AbstractSummary_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "project_abstract_summary_without_cfda",
        "json_input": {
            "funding_opportunity_number": "NSF-2025-001",
            "applicant_name": "University Research Foundation",
            "project_title": "Advanced Computing Research Initiative",
            "project_abstract": (
                "This research initiative focuses on developing next-generation computing "
                "algorithms for scientific applications."
            ),
        },
        "form_name": "Project_AbstractSummary_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "project_abstract_summary_energy_research",
        "json_input": {
            "funding_opportunity_number": "DOE-2025-FOA-001",
            "assistance_listing_number": "81.086",
            "applicant_name": "Clean Energy Innovation Center",
            "project_title": "Renewable Energy Grid Integration Study",
            "project_abstract": (
                "This comprehensive study examines the technical and economic challenges "
                "of integrating high levels of renewable energy into existing electrical "
                "grids. Our research team will develop new modeling tools and conduct "
                "field demonstrations to validate grid stability solutions."
            ),
        },
        "form_name": "Project_AbstractSummary_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd",
        "pretty_print": True,
    },
]

# Sample test cases for EPA Key Contacts validation
EPA_KEY_CONTACTS_TEST_CASES = [
    {
        "name": "epa_key_contacts_single_authorized_rep",
        "json_input": {
            "authorized_representative": {
                "name": {
                    "prefix": "Dr.",
                    "first_name": "John",
                    "middle_name": "A",
                    "last_name": "Smith",
                    "suffix": "Jr.",
                },
                "title": "Executive Director",
                "address": {
                    "street1": "123 Main Street",
                    "street2": "Suite 100",
                    "city": "Washington",
                    "state": "DC",
                    "zip_code": "20001",
                    "country": "USA",
                },
                "phone": "202-555-1234",
                "fax": "202-555-5678",
                "email": "john.smith@example.org",
            },
        },
        "form_name": "EPA_KeyContacts_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "epa_key_contacts_all_contacts",
        "json_input": {
            "authorized_representative": {
                "name": {
                    "first_name": "John",
                    "last_name": "Smith",
                },
                "title": "Director",
                "address": {
                    "street1": "123 Main St",
                    "city": "Washington",
                    "state": "DC",
                    "zip_code": "20001",
                    "country": "USA",
                },
                "phone": "202-555-1234",
                "email": "john@example.org",
            },
            "payee": {
                "name": {
                    "first_name": "Jane",
                    "last_name": "Doe",
                },
                "title": "CFO",
                "address": {
                    "street1": "456 Finance Ave",
                    "city": "Boston",
                    "state": "MA",
                    "zip_code": "02101",
                    "country": "USA",
                },
                "phone": "617-555-9999",
                "email": "jane@example.org",
            },
            "administrative_contact": {
                "name": {
                    "prefix": "Ms.",
                    "first_name": "Sarah",
                    "last_name": "Johnson",
                },
                "title": "Grants Administrator",
                "address": {
                    "street1": "789 Admin Blvd",
                    "city": "Chicago",
                    "state": "IL",
                    "zip_code": "60601",
                    "country": "USA",
                },
                "phone": "312-555-4567",
                "email": "sarah@example.org",
            },
            "project_manager": {
                "name": {
                    "prefix": "Dr.",
                    "first_name": "Michael",
                    "middle_name": "B",
                    "last_name": "Chen",
                    "suffix": "PhD",
                },
                "title": "Principal Investigator",
                "address": {
                    "street1": "101 Research Way",
                    "street2": "Lab Building 5",
                    "city": "San Francisco",
                    "state": "CA",
                    "zip_code": "94102",
                    "country": "USA",
                },
                "phone": "415-555-7890",
                "fax": "415-555-7891",
                "email": "mchen@example.org",
            },
        },
        "form_name": "EPA_KeyContacts_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        "pretty_print": True,
    },
    {
        "name": "epa_key_contacts_empty_form",
        "json_input": {},
        "form_name": "EPA_KeyContacts_2_0",
        "xsd_url": "https://apply07.grants.gov/apply/forms/schemas/EPA_KeyContacts_2_0-V2.0.xsd",
        "pretty_print": True,
    },
]


def get_all_test_cases() -> list[dict[str, Any]]:
    """Get all available test cases.

    Returns:
        List of all test case dictionaries
    """
    return (
        SF424_TEST_CASES
        + SF424A_TEST_CASES
        + SF424B_TEST_CASES
        + SFLLL_TEST_CASES
        + CD511_TEST_CASES
        + GG_LOBBYING_FORM_TEST_CASES
        + PROJECT_ABSTRACT_SUMMARY_TEST_CASES
        + EPA4700_4_TEST_CASES
        + EPA_KEY_CONTACTS_TEST_CASES
    )


def get_test_cases_by_form(form_name: str) -> list[dict[str, Any]]:
    """Get test cases for a specific form.

    Args:
        form_name: The form name to filter by

    Returns:
        List of test case dictionaries for the specified form
    """
    all_cases = get_all_test_cases()
    return [case for case in all_cases if case.get("form_name") == form_name]
