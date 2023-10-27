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
import src.db.models.user_models as user_models
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


class RoleFactory(BaseFactory):
    class Meta:
        model = user_models.Role

    user_id = factory.LazyAttribute(lambda u: u.user.id)
    user = factory.SubFactory("tests.src.db.models.factories.UserFactory", roles=[])

    type = factory.Iterator([r.value for r in user_models.RoleType])


class UserFactory(BaseFactory):
    class Meta:
        model = user_models.User

    id = Generators.UuidObj
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = "123-456-7890"
    date_of_birth = factory.Faker("date_object")
    is_active = factory.Faker("boolean")

    roles = factory.RelatedFactoryList(RoleFactory, size=2, factory_related_name="user")


class OpportunityFactory(BaseFactory):
    class Meta:
        model = opportunity_models.Opportunity

    opportunity_id = factory.Sequence(lambda n: n)

    opportunity_number = factory.Sequence(lambda n: f"ABC-{n}-XYZ-001")
    opportunity_title = factory.LazyFunction(lambda: f"Research into {fake.job()} industry")
    agency = factory.Iterator(["US-ABC", "US-XYZ", "US-123"])
    category = factory.fuzzy.FuzzyChoice(OpportunityCategory)
    is_draft = factory.Faker("boolean", chance_of_getting_true=50)
