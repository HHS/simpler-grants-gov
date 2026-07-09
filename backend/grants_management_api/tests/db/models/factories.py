from datetime import datetime

import factory
import factory.fuzzy
import faker
import grants_shared.adapters.db as db
from grants_shared.util import datetime_util
from sqlalchemy.orm import scoped_session

import src.db.models.user_models as user_models
from src.constants.lookup_constants import ExternalUserType, GrantsMgmtUserType

fake = faker.Faker()

_db_session: db.Session | None = None


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


class Generators:
    Now = factory.LazyFunction(datetime.now)
    UtcNow = factory.LazyFunction(datetime_util.utcnow)
    UuidObj = factory.Faker("uuid4", cast_to=None)
    PhoneNumber = factory.Sequence(lambda n: f"123-456-{n:04}")


# The scopefunc ensures that the session gets cleaned up after each test
# it implicitly calls `remove()` on the session.
# see https://docs.sqlalchemy.org/en/20/orm/contextual.html
Session = scoped_session(lambda: get_db_session(), scopefunc=lambda: get_db_session())


class BaseFactory(factory.alchemy.SQLAlchemyModelFactory):

    class Meta:
        abstract = True
        sqlalchemy_session = Session
        sqlalchemy_session_persistence = "commit"


###################
# User & Auth Factories
###################


class GrantsMgmtUserFactory(BaseFactory):
    class Meta:
        model = user_models.GrantsMgmtUser

    grants_mgmt_user_id = Generators.UuidObj
    user_type = GrantsMgmtUserType.STANDARD


class GrantsMgmtLinkExternalUserFactory(BaseFactory):
    class Meta:
        model = user_models.GrantsMgmtLinkExternalUser

    grants_mgmt_link_external_user_id = Generators.UuidObj
    external_user_id = Generators.UuidObj

    grants_mgmt_user = factory.SubFactory(GrantsMgmtUserFactory)
    grants_mgmt_user_id = factory.LazyAttribute(lambda s: s.grants_mgmt_user.grants_mgmt_user_id)

    external_user_type = factory.fuzzy.FuzzyChoice(ExternalUserType)

    email = factory.Faker("email")


class GrantsMgmtLoginGovStateFactory(BaseFactory):
    class Meta:
        model = user_models.GrantsMgmtLoginGovState

    grants_mgmt_login_gov_state_id = Generators.UuidObj
    nonce = Generators.UuidObj


class GrantsMgmtUserTokenSessionFactory(BaseFactory):
    class Meta:
        model = user_models.GrantsMgmtUserTokenSession

    grants_mgmt_user = factory.SubFactory(GrantsMgmtUserFactory)
    grants_mgmt_user_id = factory.LazyAttribute(lambda s: s.grants_mgmt_user.grants_mgmt_user_id)

    token_id = Generators.UuidObj

    expires_at = factory.Faker("date_time_between", start_date="+1d", end_date="+10d")

    is_valid = True
