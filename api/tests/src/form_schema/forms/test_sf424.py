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
        "OtherEstimatedFunding": "10.00",
        "ProgramIncomeEstimatedFunding": "10.00",
        "TotalEstimatedFunding": "9020.00",
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


def test_sf424_v4_0_valid_json(sf424_v4_0, valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(valid_json_v4_0, sf424_v4_0)
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


# TODO - tests to do still
# Conditional validation working
# Format/length validation (at least some to make sure I set it up right)
# Array length validation
# regex
# A test with all optional stuff set
