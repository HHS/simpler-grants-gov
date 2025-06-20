import pytest

from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.jsonschema_validator import validate_json_schema_for_form


@pytest.fixture()
def sf424_v4_0(db_session):
    with db_session.begin():
        db_session.merge(SF424_v4_0)

    return SF424_v4_0


VALID_SF424_4_0 = {
    "SubmissionType": "Application",
    "ApplicationType": "New",
    "DateReceived": "2025-01-01",
    "OrganizationName": "Example Org",
    "EmployerTaxpayerIdentificationNumber": "123-456-7890",
    "SAMUEI": "UEI123123123",
    "Applicant": {}, # TODO
    "ContactPerson": {}, # TODO
    "PhoneNumber": "123-456-7890",
    "Email": "example@mail.com",
    "ApplicantTypeCode": ["P: Individual"],
    "AgencyName": "Department of Research",
    "FundingOpportunityNumber": "ABC-123",
    "FundingOpportunityTitle": "My Example Opportunity",
    "ProjectTitle": "",
    "CongressionalDistrictApplicant": "",
    "CongressionalDistrictProgramProject": "",
    "ProjectStartDate": "",
    "ProjectEndDate": "",
    "FederalEstimatedFunding": "",
    "ApplicantEstimatedFunding": "",
    "StateEstimatedFunding": "",
    "LocalEstimatedFunding": "",
    "OtherEstimatedFunding": "",
    "ProgramIncomeEstimatedFunding": "",
    "TotalEstimatedFunding": "",
    "StateReview": "",
    "DelinquentFederalDebt": "",
    "CertificationAgree": "",
    "AuthorizedRepresentative": "",
    "AuthorizedRepresentativePhoneNumber": "",
    "AuthorizedRepresentativeEmail": "",
    "AORSignature": "",
    "DateSigned": "",
}


def test_sf424_v4_0_valid_json(db_session, enable_factory_create, sf424_v4_0):
    validate_json_schema_for_form({}, sf424_v4_0)


def test_sf424_v4_0_empty_json(db_session, enable_factory_create, sf424_v4_0):
    validation_issues = validate_json_schema_for_form({}, sf424_v4_0)
    print(validation_issues)
