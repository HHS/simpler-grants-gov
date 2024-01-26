"""Factories for generating test data.

These factories are used to generate test data for the tests. They are
used both for generating in memory objects and for generating objects
that are persisted to the database.

The factories are based on the `factory_boy` library. See
https://factoryboy.readthedocs.io/en/latest/ for more information.
"""
from datetime import datetime
from typing import Optional

import factory
import factory.fuzzy
import faker
from sqlalchemy.orm import scoped_session

import src.adapters.db as db
import src.db.models.opportunity_models as opportunity_models
import src.db.models.staging.staging_topportunity_models as staging_topportunity_models
import src.util.datetime_util as datetime_util
from src.constants.lookup_constants import OpportunityCategory

_db_session: Optional[db.Session] = None

fake = faker.Faker()


def get_db_session() -> db.Session:
    # _db_session is only set in the pytest fixture `enable_factory_create`
    # so that tests do not unintentionally write to the database.
    if _db_session is None:
        raise Exception(
            """Factory db_session is not initialized.

            If your tests don't need to cover database behavior, consider
            calling the `build()` method instead of `create()` on the factory to
            not persist the generated model.

            If running tests that actually need data in the DB, pull in the
            `enable_factory_create` fixture to initialize the db_session.
            """
        )

    return _db_session


# The scopefunc ensures that the session gets cleaned up after each test
# it implicitly calls `remove()` on the session.
# see https://docs.sqlalchemy.org/en/20/orm/contextual.html
Session = scoped_session(lambda: get_db_session(), scopefunc=lambda: get_db_session())


class Generators:
    Now = factory.LazyFunction(datetime.now)
    UtcNow = factory.LazyFunction(datetime_util.utcnow)
    UuidObj = factory.Faker("uuid4", cast_to=None)


class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):
    class Meta:
        abstract = True
        sqlalchemy_session = Session
        sqlalchemy_session_persistence = "commit"


class OpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.Opportunity

    opportunity_id = factory.Sequence(lambda n: n)

    opportunity_number = factory.Sequence(lambda n: f"ABC-{n}-XYZ-001")
    opportunity_title = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")

    agency = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])

    category = factory.fuzzy.FuzzyChoice(OpportunityCategory)
    # only set the category explanation if category is Other
    category_explanation = factory.Maybe(
        decider=factory.LazyAttribute(lambda o: o.category == OpportunityCategory.OTHER),
        yes_declaration=factory.Sequence(lambda n: f"Category as chosen by order #{n * n - 1}"),
        no_declaration=None,
    )

    is_draft = False  # Because we filter out drafts, just default these to False

    revision_number = 0  # We'll want to consider how we handle this when we add history


####################################
# Staging Table Factories
####################################


class StagingTopportunityFactory(BaseFactory):
    class Meta:
        model = staging_topportunity_models.StagingTopportunity

    opportunity_id = factory.Sequence(lambda n: n)

    oppnumber = factory.Sequence(lambda n: f"ABC-{n}-XYZ-001")
    opptitle = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")

    owningagency = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])

    oppcategory = factory.fuzzy.FuzzyChoice(OpportunityCategory)
    # only set the category explanation if category is Other
    category_explanation = factory.Maybe(
        decider=factory.LazyAttribute(lambda o: o.oppcategory == OpportunityCategory.OTHER),
        yes_declaration=factory.Sequence(lambda n: f"Category as chosen by order #{n * n - 1}"),
        no_declaration=None,
    )

    is_draft = "N"  # Because we filter out drafts, just default these to False

    revision_number = 0

    # Make sure updated_at is after created_at just to make the data realistic
    created_at = factory.Faker("date_time")
    updated_at = factory.LazyAttribute(lambda o: fake.date_time_between(start_date=o.created_at, end_date="now"))

    created_date = factory.LazyAttribute(lambda o: o.created_at.date())
    last_upd_date = factory.LazyAttribute(lambda o: o.updated_at.date())