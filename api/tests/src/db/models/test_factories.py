from datetime import datetime

import pytest

import src.adapters.db as db
from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from tests.src.db.models.factories import OpportunityFactory

opportunity_params = {
    "opportunity_number": 100123456,
    "opportunity_title": "Study math",
    "agency": "Agency of Math",
    "category": OpportunityCategory.CONTINUATION,
    "is_draft": False,
}


def validate_opportunity_record(opportunity: Opportunity, expected_values=None):
    if expected_values:
        assert opportunity.opportunity_id is not None
        for k, v in expected_values.items():
            opportunity_v = getattr(opportunity, k)
            if isinstance(opportunity_v, datetime):
                opportunity_v = opportunity_v.isoformat()

            assert str(opportunity_v) == str(v)

    else:
        # Otherwise just validate the values are set
        assert opportunity.opportunity_id is not None
        assert opportunity.opportunity_title is not None
        assert opportunity.opportunity_number is not None
        assert opportunity.is_draft is not None
        assert opportunity.category is not None


def test_opportunity_factory_build():
    # Build doesn't use the DB

    # Build sets the values
    opportunity = OpportunityFactory.build()
    validate_opportunity_record(opportunity)

    opportunity = OpportunityFactory.build(**opportunity_params)
    validate_opportunity_record(opportunity, opportunity_params)


def test_factory_create_uninitialized_db_session():
    # DB factory access is disabled from tests unless you add the
    # 'enable_factory_create' fixture.
    with pytest.raises(Exception, match="Factory db_session is not initialized."):
        OpportunityFactory.create()


def test_opportunity_factory_create(enable_factory_create, db_session: db.Session):
    # Create actually writes a record to the DB when run
    # so we'll check the DB directly as well.
    opportunity = OpportunityFactory.create()
    validate_opportunity_record(opportunity)

    db_record = (
        db_session.query(Opportunity)
        .filter(Opportunity.opportunity_id == opportunity.opportunity_id)
        .one_or_none()
    )
    # Make certain the DB record matches the factory one.
    validate_opportunity_record(db_record, db_record.for_json())

    opportunity = OpportunityFactory.create(**opportunity_params)
    validate_opportunity_record(opportunity, opportunity_params)

    db_record = (
        db_session.query(Opportunity)
        .filter(Opportunity.opportunity_id == opportunity.opportunity_id)
        .one_or_none()
    )
    # Make certain the DB record matches the factory one.
    validate_opportunity_record(db_record, db_record.for_json())

    # Make certain nullable fields can be overriden
    null_params = {"agency": None}
    opportunity = OpportunityFactory.create(**null_params)
    validate_opportunity_record(opportunity, null_params)
