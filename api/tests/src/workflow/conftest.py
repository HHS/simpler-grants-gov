import pytest

from src.constants.lookup_constants import Privilege
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import User
from tests.lib.agency_test_utils import create_user_in_agency
from tests.src.db.models.factories import AgencyFactory, OpportunityFactory


@pytest.fixture(autouse=True)
def workflow_user_init(workflow_user):
    pass


@pytest.fixture
def agency(enable_factory_create) -> Agency:
    # Putting this in a fixture so the other fixtures can reference the same agency
    return AgencyFactory.create()


@pytest.fixture
def budget_officer(agency) -> User:
    user, _ = create_user_in_agency(agency=agency, privileges=[Privilege.BUDGET_OFFICER_APPROVAL])
    return user


@pytest.fixture
def other_agency_budget_officer(enable_factory_create) -> User:
    # A budget officer in a random agency
    user, _ = create_user_in_agency(privileges=[Privilege.BUDGET_OFFICER_APPROVAL])
    return user


@pytest.fixture
def program_officer(agency) -> User:
    user, _ = create_user_in_agency(agency=agency, privileges=[Privilege.PROGRAM_OFFICER_APPROVAL])
    return user


@pytest.fixture
def other_agency_program_officer(enable_factory_create) -> User:
    # A program officer in a random agency
    user, _ = create_user_in_agency(privileges=[Privilege.PROGRAM_OFFICER_APPROVAL])
    return user


@pytest.fixture
def opportunity(agency) -> Opportunity:
    return OpportunityFactory.create(agency_code=agency.agency_code)
