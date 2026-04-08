import pytest
from marshmallow import ValidationError

from src.api.opportunities_v1.opportunity_schemas import OpportunitySearchCSVRequestV1Schema


def test_opportunity_search_csv_schema_accepts_query_filters_only():
    schema = OpportunitySearchCSVRequestV1Schema()

    loaded = schema.load(
        {
            "query": "research",
            "query_operator": "OR",
            "filters": {"opportunity_status": {"one_of": ["posted"]}},
        }
    )

    assert loaded["query"] == "research"
    assert loaded["query_operator"] == "OR"
    assert loaded["filters"]["opportunity_status"]["one_of"] == ["posted"]


@pytest.mark.parametrize("field_name", ["pagination", "format"])
def test_opportunity_search_csv_schema_rejects_non_contract_fields(field_name):
    schema = OpportunitySearchCSVRequestV1Schema()
    payload = {
        field_name: "csv" if field_name == "format" else {"page_offset": 1, "page_size": 25}
    }

    with pytest.raises(ValidationError) as exc_info:
        schema.load(payload)

    assert field_name in exc_info.value.messages
