import pytest

from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


@pytest.fixture()
def sf424_v4_0(db_session):
    with db_session.begin():
        db_session.merge(SF424_v4_0)

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


def test_sf424_v4_0_valid_json(db_session, enable_factory_create, sf424_v4_0, valid_json_v4_0):
    validation_issues = validate_json_schema_for_form(VALID_SF424_4_0, sf424_v4_0)
    assert len(validation_issues) == 0

def test_sf424_v4_0_empty_json(db_session, enable_factory_create, sf424_v4_0):
    validation_issues = validate_json_schema_for_form({}, sf424_v4_0)
    print(validation_issues)


def test_sf424_v4_0_applicant_type_other(db_session, enable_factory_create, sf424_v4_0):
    validation_issues = validate_json_schema_for_form(VALID_SF424_4_0, sf424_v4_0)
    assert len(validation_issues) == 0
