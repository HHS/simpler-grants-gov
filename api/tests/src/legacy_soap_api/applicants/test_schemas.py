import pytest

from src.legacy_soap_api.applicants import schemas


def test_alias_assignment_and_retrieval_function_correctly() -> None:
    alias_field_names_dict = {
        "FundingOpportunityNumber": "1",
        "CFDANumber": None,
        "CompetitionID": None,
    }
    schema_from_alias_field_names = schemas.OpportunityFilter(**alias_field_names_dict)
    assert schema_from_alias_field_names is not None
    assert schema_from_alias_field_names.model_dump(by_alias=True) == alias_field_names_dict

    non_alias_field_names_dict = {
        "funding_opportunity_number": "1",
        "cfda_number": None,
        "competition_id": None,
    }
    schema_from_non_alias_field_names = schemas.OpportunityFilter(**non_alias_field_names_dict)
    assert schema_from_non_alias_field_names is not None
    assert schema_from_non_alias_field_names.model_dump() == non_alias_field_names_dict
