from datetime import datetime

import factory
import factory.fuzzy
import faker
import grants_shared.adapters.db as db
from faker.providers import BaseProvider
from grants_shared.util import datetime_util
from sqlalchemy.orm import scoped_session

import src.db.models.resource_models as resource_models
import src.db.models.user_models as user_models
from src.constants.lookup_constants import (
    ExternalUserType,
    MgmtPrivilege,
    MgmtResourceType,
    MgmtUserType,
)


class CustomProvider(BaseProvider):
    """
    This class is a custom faker provider that can be used to generate
    fake data for our specific scenarios.

    The name of the functions defined in this class is the name of the individual provider.
    For example, the "agency_code" method below can be called by doing either of the following::

        fake.agency_code()

        factory.Faker("agency_code")

    Below we register this provider class with both the faker instance we setup, as well as
    the underlying one backing the factory's faker instance.

    See: https://faker.readthedocs.io/en/master/#how-to-create-a-provider
    """

    # Various words we can use when building the department names
    # Stuff that sounds like it might be an department, even if its not exactly the name
    DEPARTMENT_WORDS = [
        "Agriculture",
        "Commerce",
        "Defense",
        "Education",
        "Economics",
        "Energy",
        "Health",
        "Housing",
        "Justice",
        "Labor",
        "State",
        "Interior",
        "Transportation",
        "Science",
        "Arts",
    ]

    DEPARTMENT_NAME_FORMATS = [
        "Department of {{department_word}}",
        "Department of the {{department_word}}",
        "Agency for {{department_word}}",
        "National {{department_word}} Administration",
    ]

    # Various words associated with agencies
    AGENCY_WORDS = [
        "Health",
        "Global Affairs",
        "Human Development",
        "Intergovernmental Affairs",
        "Healthcare",
        "Medicare",
        "Disease Control",
        "Disease Prevention",
        "Consumer Affairs",
        "Tax Policy",
        "Management",
        "Legislative Affairs",
        "Aviation",
        "Highway",
        "Railroad",
        "Inspector General",
        "Intelligence",
        "Labor",
        "Civil Rights",
        "Antitrust",
        "Attorney General",
        "Housing",
    ]

    SUBAGENCY_NAME_FORMATS = [
        "Center for {{agency_word}}",
        "Agency for {{agency_word}}",
        "Administration for {{agency_word}} and {{agency_word}}",
        "Center for Advanced {{agency_word}} Research",
        "{{agency_word}} and {{agency_word}} Administration",
        "{{agency_word}} Service",
        "Office of {{agency_word}}",
        "Office of {{agency_word}} for {{agency_word}}",
        "National Institute on {{agency_word}}",
        "Bureau of {{agency_word}}",
    ]

    def department_word(self) -> str:
        return self.random_element(self.DEPARTMENT_WORDS)

    def department_name(self) -> str:
        pattern = self.random_element(self.DEPARTMENT_NAME_FORMATS)
        return self.generator.parse(pattern)

    def agency_word(self) -> str:
        return self.random_element(self.AGENCY_WORDS)

    def subagency_name(self) -> str:
        pattern = self.random_element(self.SUBAGENCY_NAME_FORMATS)
        return self.generator.parse(pattern)


fake = faker.Faker()
fake.add_provider(CustomProvider)
factory.Faker.add_provider(CustomProvider)

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


class MgmtUserFactory(BaseFactory):
    class Meta:
        model = user_models.MgmtUser

    mgmt_user_id = Generators.UuidObj
    user_type = MgmtUserType.STANDARD


class MgmtLinkExternalUserFactory(BaseFactory):
    class Meta:
        model = user_models.MgmtLinkExternalUser

    mgmt_link_external_user_id = Generators.UuidObj
    external_user_id = Generators.UuidObj

    mgmt_user = factory.SubFactory(MgmtUserFactory)
    mgmt_user_id = factory.LazyAttribute(lambda s: s.mgmt_user.mgmt_user_id)

    external_user_type = factory.fuzzy.FuzzyChoice(ExternalUserType)

    email = factory.Faker("email")


class MgmtLoginGovStateFactory(BaseFactory):
    class Meta:
        model = user_models.MgmtLoginGovState

    mgmt_login_gov_state_id = Generators.UuidObj
    nonce = Generators.UuidObj


class MgmtUserTokenSessionFactory(BaseFactory):
    class Meta:
        model = user_models.MgmtUserTokenSession

    mgmt_user = factory.SubFactory(MgmtUserFactory)
    mgmt_user_id = factory.LazyAttribute(lambda s: s.mgmt_user.mgmt_user_id)

    token_id = Generators.UuidObj

    expires_at = factory.Faker("date_time_between", start_date="+1d", end_date="+10d")

    is_valid = True


class MgmtInternalResourceFactory(BaseFactory):
    class Meta:
        model = resource_models.MgmtInternalResource

    mgmt_internal_resource_id = Generators.UuidObj
    internal_resource_name = "My internal resource"


class DepartmentFactory(BaseFactory):
    class Meta:
        model = resource_models.Department

    department_id = Generators.UuidObj
    department_name = factory.Faker("department_name")


class SubagencyFactory(BaseFactory):
    class Meta:
        model = resource_models.Subagency

    subagency_id = Generators.UuidObj
    subagency_name = factory.Faker("subagency_name")

    department = factory.SubFactory(DepartmentFactory)
    department_id = factory.LazyAttribute(lambda s: s.department.department_id)


class TeamFactory(BaseFactory):
    class Meta:
        model = resource_models.Team

    team_id = Generators.UuidObj
    team_name = factory.Faker("subagency_name")

    subagency = factory.SubFactory(SubagencyFactory)
    subagency_id = factory.LazyAttribute(lambda t: t.subagency.subagency_id)


class MgmtRoleFactory(BaseFactory):
    class Meta:
        model = resource_models.MgmtRole

    mgmt_role_id = Generators.UuidObj
    role_name = factory.Faker("sentence", nb_words=3)
    is_core = False

    resource_types = [MgmtResourceType.TEAM]
    privileges = [MgmtPrivilege.VIEW_TEAM]

    class Params:
        is_department_role = factory.Trait(
            resource_types=[MgmtResourceType.DEPARTMENT],
            privileges=[MgmtPrivilege.VIEW_DEPARTMENT],
        )

        is_subagency_role = factory.Trait(
            resource_types=[MgmtResourceType.SUBAGENCY],
            privileges=[MgmtPrivilege.VIEW_SUBAGENCY],
        )

        is_team_role = factory.Trait(
            resource_types=[MgmtResourceType.TEAM],
            privileges=[MgmtPrivilege.VIEW_TEAM],
        )
