import random
from datetime import datetime

import factory
import faker
from sqlalchemy.orm import scoped_session

import grants_shared.adapters.db as db
import tests.grants_shared.db_test_models.db_test_models as db_test_models
from grants_shared.util import datetime_util

fake = faker.Faker()

_db_session: db.Session | None = None


def get_db_session() -> db.Session:
    # _db_session is only set in the pytest fixture `enable_factory_create`
    # so that tests do not unintentionally write to the database.
    if _db_session is None:
        raise Exception("""Factory db_session is not initialized.

            If your tests don't need to cover database behavior, consider
            calling the `build()` method instead of `create()` on the factory to
            not persist the generated model.

            If running tests that actually need data in the DB, pull in the
            `enable_factory_create` fixture to initialize the db_session.
            """)

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


class ExampleTableFactory(BaseFactory):
    class Meta:
        model = db_test_models.ExampleTable

    example_id = Generators.UuidObj

    description = factory.Faker("paragraph", nb_sentences=1)
    my_count = factory.Faker("random_int", min=1, max=10)

    friends = factory.RelatedFactoryList(
        "tests.grants_shared.db.models.factories.FriendTableFactory",
        factory_related_name="example",
        size=lambda: random.randint(1, 3),
    )


class FriendTableFactory(BaseFactory):
    class Meta:
        model = db_test_models.FriendTable

    friend_id = Generators.UuidObj

    example = factory.SubFactory(ExampleTableFactory)
    example_id = factory.LazyAttribute(lambda f: f.example.example_id)

    friend_types = factory.Faker(
        "random_elements",
        length=random.randint(1, 3),
        elements=[f for f in db_test_models.FriendType],
        unique=True,
    )


class UserFactory(BaseFactory):
    class Meta:
        model = db_test_models.User

    user_id = Generators.UuidObj


class LinkExternalUserFactory(BaseFactory):
    class Meta:
        model = db_test_models.LinkExternalUser

    link_external_user_id = Generators.UuidObj
    external_user_id = Generators.UuidObj
    user = factory.SubFactory(UserFactory)
    user_id = factory.LazyAttribute(lambda s: s.user.user_id)
    email = factory.Faker("email")


class LoginGovStateFactory(BaseFactory):
    class Meta:
        model = db_test_models.LoginGovState

    login_gov_state_id = Generators.UuidObj
    nonce = Generators.UuidObj
