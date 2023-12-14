import pytest
from sqlalchemy import text

from src.adapters.db.type_decorators.postgres_type_decorators import StrEnumColumn
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from tests.src.db.models.factories import OpportunityFactory


@pytest.mark.parametrize(
    "category,db_value",
    [(OpportunityCategory.CONTINUATION, "C"), (OpportunityCategory.EARMARK, "E"), (None, None)],
)
def test_str_enum_column_conversion(db_session, enable_factory_create, category, db_value):
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

    # Verify what we stored in the DB is the string itself
    raw_db_value = db_session.execute(
        text(
            f"select category from {Opportunity.get_table_name()} where opportunity_id={opportunity.opportunity_id}"  # nosec
        )
    ).scalar()
    assert raw_db_value == db_value


def test_str_enum_column_bind_type_invalid():
    column = StrEnumColumn(OpportunityCategory)

    with pytest.raises(Exception, match="Cannot convert value of type"):
        column.process_bind_param(5, None)


def test_str_enum_column_process_result_type_invalid():
    column = StrEnumColumn(OpportunityCategory)

    with pytest.raises(Exception, match="Cannot process value from DB of type"):
        column.process_result_value(5, None)
