from enum import StrEnum

import pytest
from sqlalchemy import text

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.lookup_models import LkOpportunityCategory
from src.db.models.opportunity_models import Opportunity
from tests.src.db.models.factories import OpportunityFactory


@pytest.mark.parametrize(
    "category,db_value",
    [(OpportunityCategory.CONTINUATION, 3), (OpportunityCategory.EARMARK, 4), (None, None)],
)
def test_lookup_column_conversion(
    db_session, enable_factory_create, category, db_value, test_api_schema
):
    # Verify column works with factories
    opportunity = OpportunityFactory.create(category=category)
    assert opportunity.category == category

    # Verify fetching from the DB works
    db_session.expire_all()

    opportunity_db = (
        db_session.query(Opportunity)
        .where(Opportunity.opportunity_id == opportunity.opportunity_id)
        .first()
    )
    assert opportunity_db.category == category

    # Verify what we stored in the DB is the integer
    raw_db_value = db_session.execute(
        text(
            f"select opportunity_category_id from {test_api_schema}.{Opportunity.get_table_name()} where opportunity_id={opportunity.opportunity_id}"  # nosec
        )
    ).scalar()
    assert raw_db_value == db_value


def test_lookup_column_bind_type_invalid():
    lookup_column = LookupColumn(LkOpportunityCategory)
    with pytest.raises(Exception, match="Cannot convert value of type"):
        lookup_column.process_bind_param("hello", None)

    class TestEnum(StrEnum):
        DISCRETIONARY = "D"

    # Verify that just because an enum looks similar, if it's a different
    # type it will also error
    with pytest.raises(Exception, match="Cannot convert value of type"):
        lookup_column.process_bind_param(TestEnum.DISCRETIONARY, None)


def test_lookup_column_process_result_type_invalid():
    lookup_column = LookupColumn(LkOpportunityCategory)
    with pytest.raises(Exception, match="Cannot process value from DB of type"):
        lookup_column.process_result_value("hello", None)
