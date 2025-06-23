import pytest

from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


@pytest.fixture()
def sf424_v4_0():
    return SF424_v4_0


@pytest.fixture
def valid_json_v4_0():
    return {
        "SubmissionType": "Application",
        "ApplicationType": "New",
        "DateReceived": "2025-01-01",
        "OrganizationName": "Example Org",
        "EmployerTaxpayerIdentificationNumber": "123-456-7890",
        "SAMUEI": "UEI123123123",
        "Applicant": {
            "Street1": "123 Main St",
            "City": "Exampleburg",
            "State": "NY: New York",
            "Country": "USA: UNITED STATES",
            "ZipCode": "12345",
        },
        "ContactPerson": {
            "FirstName": "Bob",
            "LastName": "Smith",
        },
        "PhoneNumber": "123-456-7890",
        "Email": "example@mail.com",
        "ApplicantTypeCode": ["P: Individual"],
        "AgencyName": "Department of Research",
        "FundingOpportunityNumber": "ABC-123",
        "FundingOpportunityTitle": "My Example Opportunity",
        "ProjectTitle": "My Project",
        "CongressionalDistrictApplicant": "MI.345",
        "CongressionalDistrictProgramProject": "MI.567",
        "ProjectStartDate": "2026-01-01",
        "ProjectEndDate": "2026-12-31",
        "FederalEstimatedFunding": "5000.00",
        "ApplicantEstimatedFunding": "1000.00",
        "StateEstimatedFunding": "2000.00",
        "LocalEstimatedFunding": "1000.00",
        "OtherEstimatedFunding": "0.00",
        "ProgramIncomeEstimatedFunding": "10.00",
        "TotalEstimatedFunding": "9010.00",
        "StateReview": "c. Program is not covered by E.O. 12372.",
        "DelinquentFederalDebt": False,
        "CertificationAgree": True,
        "AuthorizedRepresentative": {
            "FirstName": "Bob",
            "LastName": "Smith",
        },
        "AuthorizedRepresentativePhoneNumber": "123-456-7890",
        "AuthorizedRepresentativeEmail": "example@mail.com",
        "AORSignature": "Bob Smith",
        "DateSigned": "2025-06-01",
    }


@pytest.fixture
def full_valid_json_v4_0(valid_json_v4_0):
    # This makes it so all optional fields are set
    # and the if-then required logic would be hit and satisfied

    return valid_json_v4_0 | {
        "ApplicationType": "Revision",
        "RevisionType": "E: Other (specify)",
        "RevisionOtherSpecify": "I am redoing it",
        "ApplicantID": "ABC123",
        "FederalEntityIdentifier": "XYZ456",
        "FederalAwardIdentifier": "1234567890",
        "StateReceiveDate": "2025-06-01",
        "StateApplicationID": "12345",
        "Applicant": {
            "Street1": "123 Main St",
            "Street2": "Room 101",
            "City": "Big Apple",
            "County": "Madison",
            "State": "NY: New York",
            "Country": "CAN: CANADA",
            "ZipCode": "56789",
        },
        "DepartmentName": "Department of Research",
        "DivisionName": "Science",
        "ContactPerson": {
            "Prefix": "Mrs",
            "FirstName": "Sally",
            "MiddleName": "Anne",
            "LastName": "Jones",
            "Suffix": "III",
            "Title": "Director",
        },
        "OrganizationAffiliation": "Secret Research",
        "Fax": "123-456-7890",
        "ApplicantTypeCode": ["P: Individual", "X: Other (specify)"],
        "ApplicantTypeOtherSpecify": "Secret Development",
        "CFDANumber": "12.345",
        "CFDAProgramTitle": "Secret Research",
        "CompetitionIdentificationNumber": "ABC-XYZ-123",
        "CompetitionIdentificationTitle": "Secret Research Project",
        "AreasAffected": "06dea634-6882-4ffc-805c-f1e3e43038c7",
        "AdditionalProjectTitle": [
            "e7293742-d325-4f11-88ac-c17e58a775e4",
            "fa824ef2-413a-4e93-a4b3-ad87df6f6dad",
        ],
        "AdditionalCongressionalDistricts": "9003399d-93ea-42db-a80b-c3f94fc1aa16",
        "StateReview": "a. This application was made available to the State under the Executive Order 12372 Process for review on",
        "StateReviewAvailableDate": "2025-05-31",
        "DelinquentFederalDebt": True,
        "DebtExplanation": "fc1c203a-4890-4237-a54f-8a66a7938cca",
        "AuthorizedRepresentative": {
            "Prefix": "Mr",
            "FirstName": "Bob",
            "MiddleName": "Frank",
            "LastName": "Smith",
            "Suffix": "Jr",
            "Title": "Agent",
        },
        "AuthorizedRepresentativeFax": "333-333-3333",
    }


def test_sf424_v4_0_valid_json(sf424_v4_0, valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(valid_json_v4_0, sf424_v4_0)
    assert len(validation_issues) == 0


def test_sf424_v4_0_full_valid_json(sf424_v4_0, full_valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(full_valid_json_v4_0, sf424_v4_0)
    assert len(validation_issues) == 0


def test_sf424_v4_0_empty_json(sf424_v4_0):
    validation_issues = validate_json_schema_for_form({}, sf424_v4_0)

    fields = []
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"

        # The field value is just "$", get the actual
        # fields that failed validation by parsing the message
        # which is like "'Field' is a required property"
        field = validation_issue.message.split("'")[1]
        fields.append(field)

    assert set(fields) == {
        "SubmissionType",
        "ApplicationType",
        "DateReceived",
        "OrganizationName",
        "EmployerTaxpayerIdentificationNumber",
        "SAMUEI",
        "Applicant",
        "ContactPerson",
        "PhoneNumber",
        "Email",
        "ApplicantTypeCode",
        "AgencyName",
        "FundingOpportunityNumber",
        "FundingOpportunityTitle",
        "ProjectTitle",
        "CongressionalDistrictApplicant",
        "CongressionalDistrictProgramProject",
        "ProjectStartDate",
        "ProjectEndDate",
        "FederalEstimatedFunding",
        "ApplicantEstimatedFunding",
        "StateEstimatedFunding",
        "LocalEstimatedFunding",
        "OtherEstimatedFunding",
        "ProgramIncomeEstimatedFunding",
        "TotalEstimatedFunding",
        "StateReview",
        "DelinquentFederalDebt",
        "CertificationAgree",
        "AuthorizedRepresentative",
        "AuthorizedRepresentativePhoneNumber",
        "AuthorizedRepresentativeEmail",
        "AORSignature",
        "DateSigned",
    }


def test_sf424_v4_0_empty_nested(sf424_v4_0, valid_json_v4_0):
    data = valid_json_v4_0
    data["Applicant"] = {}
    data["ContactPerson"] = {}
    data["AuthorizedRepresentative"] = {}

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)

    fields = []
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"
        # The field will be the path except the field name, get that
        # out of the message

        field = validation_issue.message.split("'")[1]
        fields.append(f"{validation_issue.field}.{field}")

    assert set(fields) == {
        "$.Applicant.City",
        "$.Applicant.Country",
        "$.Applicant.Street1",
        "$.AuthorizedRepresentative.FirstName",
        "$.AuthorizedRepresentative.LastName",
        "$.ContactPerson.FirstName",
        "$.ContactPerson.LastName",
    }


@pytest.mark.parametrize(
    "value",
    [
        ["X: Other (specify)"],
        ["X: Other (specify)", "A: State Government"],
        ["E: Regional Organization", "X: Other (specify)", "G: Independent School District"],
    ],
)
def test_sf424_v4_0_applicant_type_other(sf424_v4_0, valid_json_v4_0, value):
    """Verify that an applicant type of Other makes ApplicantTypeOtherSpecify required"""
    data = valid_json_v4_0
    data["ApplicantTypeCode"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == "'ApplicantTypeOtherSpecify' is a required property"


@pytest.mark.parametrize(
    "value,expected_error",
    [
        ([], "[] should be non-empty"),
        (
            [
                "A: State Government",
                "B: County Government",
                "C: City or Township Government",
                "D: Special District Government",
            ],
            "['A: State Government', 'B: County Government', 'C: City or Township "
            "Government', 'D: Special District Government'] is too long",
        ),
    ],
)
def test_sf424_v_4_0_applicant_type_length(sf424_v4_0, valid_json_v4_0, value, expected_error):
    """Verify applicant type length must be 1-3"""
    data = valid_json_v4_0
    data["ApplicantTypeCode"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == expected_error


@pytest.mark.parametrize("value", ["-123.45", "123.4", "$123.45", "123..45", "12.345"])
def test_sf424_v4_0_monetary_amount_format(sf424_v4_0, valid_json_v4_0, value):
    data = valid_json_v4_0
    data["FederalEstimatedFunding"] = value

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].message == f"'{value}' does not match '^\\\\d*([.]\\\\d{{2}})?$'"


@pytest.mark.parametrize(
    "data",
    [
        # Date fields
        {"DateReceived": "not-a-date"},
        {"StateReceiveDate": "202323542312"},
        {"ProjectStartDate": "nope"},
        {"ProjectEndDate": "Jan 1st, 2025"},
        {"StateReviewAvailableDate": "n/a"},
        {"DateSigned": "words"},
        # Email fields
        {"Email": "567890"},
        {"AuthorizedRepresentativeEmail": "bob at mail.com"},
        # Attachment/uuid fields
        {"DebtExplanation": "not-a-uuid"},
        {"AdditionalCongressionalDistricts": "abc123"},
        {"AdditionalProjectTitle": ["not-a-uuid"]},
        {"AreasAffected": "yep"},
    ],
)
def test_sf424_v4_0_formats(sf424_v4_0, valid_json_v4_0, data):
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "format"


@pytest.mark.parametrize(
    "data",
    [
        {"ApplicantID": ""},
        {"EmployerTaxpayerIdentificationNumber": "12345678"},
        {"SAMUEI": "xyz123"},
        {"CongressionalDistrictApplicant": ""},
        {"AuthorizedRepresentative": {"FirstName": "", "LastName": "Smith"}},
        {"AuthorizedRepresentativeFax": ""},
    ],
)
def test_sf424_v4_0_min_length(sf424_v4_0, valid_json_v4_0, data):
    """Test some of the fields length requirements - does not check every single field"""
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "minLength"


@pytest.mark.parametrize(
    "data",
    [
        {"ApplicantID": "1234567890123456789012345678901234567890"},
        {"EmployerTaxpayerIdentificationNumber": "1" * 31},
        {"SAMUEI": "xyz123xyz123xyz"},
        {"CongressionalDistrictApplicant": "1234567"},
        {
            "AuthorizedRepresentative": {
                "FirstName": "Bob",
                "MiddleName": "Way-too-long-of-a-middle-name",
                "LastName": "Jones",
            }
        },
        {"CFDANumber": "1234567890.123456789"},
        {"FederalEstimatedFunding": "12345678901234567890"},
    ],
)
def test_sf424_v4_0_max_length(sf424_v4_0, valid_json_v4_0, data):
    """Test some of the fields length requirements - does not check every single field"""
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == 1
    assert validation_issues[0].type == "maxLength"


@pytest.mark.parametrize(
    "data,required_fields",
    [
        ({"ApplicationType": "Revision"}, ["RevisionType", "FederalAwardIdentifier"]),
        ({"ApplicationType": "Continuation"}, ["FederalAwardIdentifier"]),
        ({"RevisionType": "E: Other (specify)"}, ["RevisionOtherSpecify"]),
        ({"DelinquentFederalDebt": True}, ["DebtExplanation"]),
        (
            {
                "StateReview": "a. This application was made available to the State under the Executive Order 12372 Process for review on"
            },
            ["StateReviewAvailableDate"],
        ),
        ({"ApplicantTypeCode": ["X: Other (specify)"]}, ["ApplicantTypeOtherSpecify"]),
        (
            {
                "Applicant": {
                    "Street1": "123 Main St",
                    "City": "New York",
                    "Country": "USA: UNITED STATES",
                }
            },
            ["State", "ZipCode"],
        ),
    ],
)
def test_sf424_v4_0_conditionally_required_fields(
    sf424_v4_0, valid_json_v4_0, data, required_fields
):
    data = valid_json_v4_0 | data

    validation_issues = validate_json_schema_for_form(data, sf424_v4_0)
    assert len(validation_issues) == len(required_fields)
    for validation_issue in validation_issues:
        assert validation_issue.type == "required"

        # The field value is just "$", get the actual
        # fields that failed validation by parsing the message
        # which is like "'Field' is a required property"
        field = validation_issue.message.split("'")[1]
        assert field in required_fields
