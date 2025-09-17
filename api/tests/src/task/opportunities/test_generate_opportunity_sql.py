import uuid
from datetime import date, datetime
from unittest import mock

import pytest

from src.api.opportunities_v1.opportunity_schemas import OpportunityWithAttachmentsV1Schema
from src.constants.lookup_constants import (
    ApplicantType,
    CompetitionOpenToApplicant,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.task.opportunities.generate_opportunity_sql import (
    GenerateOpportunitySqlProcessor,
    OppSqlRequest,
    convert_value_to_sql_representation,
    map_lookup_value,
)
from tests.src.db.models.factories import CompetitionFactory


def test_generate_opportunity_sql_processor(enable_factory_create):
    competition = CompetitionFactory.create()
    schema = OpportunityWithAttachmentsV1Schema()
    json_opp = schema.dump(competition.opportunity)

    mocked_response = mock.MagicMock()
    mocked_response.status_code = 200
    mocked_response.json.return_value = {"data": json_opp}
    with mock.patch("requests.get", return_value=mocked_response):
        processor = GenerateOpportunitySqlProcessor(
            OppSqlRequest(opportunity_id="", environment="local", print_output=False)
        )
        processor.run()

        sql_statements = processor.sql_statements

        # Find the tables that we created statements for
        table_counts = {}
        for statement in sql_statements:
            if statement.startswith("INSERT INTO"):
                table_name = statement.split("api.")[1].split("(")[0]
                table_counts.setdefault(table_name, 0)
                table_counts[table_name] += 1

        # Verify that we created statements for all tables
        assert set(table_counts.keys()) == {
            "opportunity",
            "current_opportunity_summary",
            "opportunity_summary",
            "link_opportunity_summary_funding_instrument",
            "link_opportunity_summary_funding_category",
            "link_opportunity_summary_applicant_type",
            "opportunity_assistance_listing",
            "competition",
            "competition_form",
            "link_competition_open_to_applicant",
        }


def test_generate_opportunity_sql_not_found():
    mocked_response = mock.MagicMock()
    mocked_response.status_code = 404
    with mock.patch("requests.get", return_value=mocked_response):
        with pytest.raises(Exception, match="No opportunity found in environment"):
            GenerateOpportunitySqlProcessor(
                OppSqlRequest(opportunity_id="", environment="local")
            ).run()


@pytest.mark.parametrize(
    "value,expected_value",
    [
        (None, "null"),
        ("my string", "'my string'"),
        ("shouldn't", "'shouldn''t'"),
        (123, "123"),
        (True, "true"),
        (False, "false"),
        (date(2025, 1, 1), "'2025-01-01'"),
        (datetime(2025, 1, 1, 12, 30, 10), "'2025-01-01T12:30:10'"),
        (
            uuid.UUID("0459cb5f-d335-42a4-9e05-d48a56664cef"),
            "'0459cb5f-d335-42a4-9e05-d48a56664cef'",
        ),
    ],
)
def test_convert_value_to_sql_representation(value, expected_value):
    assert convert_value_to_sql_representation(value) == expected_value


@pytest.mark.parametrize(
    "value,expected_value",
    [
        (OpportunityCategory.CONTINUATION, 3),
        (OpportunityCategory.OTHER, 5),
        (OpportunityStatus.POSTED, 2),
        (OpportunityStatus.ARCHIVED, 4),
        (FundingInstrument.COOPERATIVE_AGREEMENT, 1),
        (FundingInstrument.GRANT, 2),
        (FundingCategory.ARTS, 3),
        (FundingCategory.ENERGY, 10),
        (ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS, 4),
        (ApplicantType.SMALL_BUSINESSES, 15),
        (CompetitionOpenToApplicant.INDIVIDUAL, 1),
        (CompetitionOpenToApplicant.ORGANIZATION, 2),
    ],
)
def test_map_lookup_value(value, expected_value):
    assert map_lookup_value(value) == expected_value
