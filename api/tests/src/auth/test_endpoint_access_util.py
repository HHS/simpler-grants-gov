import pytest

from src.auth.endpoint_access_util import (
    can_access,
    get_roles_for_agency,
    get_roles_for_app,
    get_roles_for_org,
)
from src.constants.lookup_constants import Privilege
from src.db.models.entity_models import Organization
from src.db.models.user_models import OrganizationUser
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import (
    AgencyUserFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    InternalUserRoleFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
    UserFactory,
)

ORG_PRIVILEGES = [
    Privilege.VIEW_APPLICATION,
    Privilege.MODIFY_APPLICATION,
    Privilege.SUBMIT_APPLICATION,
    Privilege.START_APPLICATION,
    Privilege.MANAGE_ORG_MEMBERS,
    Privilege.MANAGE_ORG_ADMIN_MEMBERS,
    Privilege.VIEW_ORG_MEMBERSHIP,
]

APP_PRIVILEGES = [
    Privilege.VIEW_APPLICATION,
    Privilege.MODIFY_APPLICATION,
    Privilege.SUBMIT_APPLICATION,
]


@pytest.fixture
def app(enable_factory_create):
    return ApplicationFactory.create()


@pytest.fixture
def org_a(enable_factory_create):
    return OrganizationFactory()


@pytest.fixture
def org_b(enable_factory_create):
    return OrganizationFactory()


@pytest.fixture
def app_owned_by_org_a(org_a):
    return ApplicationFactory(organization=org_a)


@pytest.fixture
def app_owned_by_org_b(org_b):
    return ApplicationFactory(organization=org_b)


@pytest.fixture
def org_role_privileges():
    return RoleFactory(privileges=ORG_PRIVILEGES)


@pytest.fixture
def app_role_privileges():
    return RoleFactory(privileges=APP_PRIVILEGES)


@pytest.fixture
def user_a_org_a(org_a, org_role_privileges):
    return OrganizationUserRoleFactory(
        organization_user=OrganizationUserFactory(organization=org_a), role=org_role_privileges
    )


@pytest.fixture
def user_b_org_b(app_owned_by_org_b, org_role_privileges):
    return OrganizationUserRoleFactory(
        organization_user=OrganizationUserFactory(organization=app_owned_by_org_b.organization),
        role=org_role_privileges,
    )


@pytest.fixture
def user_a_app_a(app_owned_by_org_a, app_role_privileges):
    return ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory(application=app_owned_by_org_a),
        role=app_role_privileges,
    )


@pytest.fixture
def user_b_app_b(app_owned_by_org_b, app_role_privileges):
    return ApplicationUserRoleFactory(
        application_user=ApplicationUserFactory(application=app_owned_by_org_b),
        role=app_role_privileges,
    )


# test for multiple users with diff priv/role
# create fixture for
# 2 orgs 2 apps multiple users
# user update-form privilige for internal role
# add manage-agency-members , get-submitted-applications for agency


class TestEndpointAccessUtil(BaseTestClass):

    # Organization
    def test_get_roles_for_org_no_role(self, user, org_a):
        """User has no organization role; should return an empty list"""
        res = get_roles_for_org(user, org_a)
        assert not res

    def test_get_roles_for_correct_org(self, user, org_a, org_b, org_role_privileges):
        """User has organization roles across multiple organizations; should return only the target org roles"""
        org_a_user_role = OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=org_a, user=user),
            role=org_role_privileges,
        )

        OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=org_b, user=user),
            role=org_role_privileges,
        )

        res = get_roles_for_org(user, org_a)

        user_orgs = user.organizations
        assert len(user_orgs) == 2

        assert len(res) == 1
        assert res[0].role_id == org_a_user_role.role_id

    @pytest.mark.parametrize("privilege", [{p} for p in ORG_PRIVILEGES])
    def test_user_a_org_a_accessing_org_a(self, user_a_org_a, org_a, privilege):
        """User with Org role accessing their own organization"""
        assert can_access(user_a_org_a.organization_user.user, privilege, org_a)


    @pytest.mark.parametrize("privilege", [{p} for p in ORG_PRIVILEGES])
    def test_user_a_org_a_accessing_org_b(self, user_a_org_a, org_b, privilege):
        """User with Org role accessing a different organization"""
        assert not can_access(user_a_org_a.organization_user.user, privilege, org_b)

    @pytest.mark.parametrize("privilege", [{p} for p in ORG_PRIVILEGES])
    def test_user_a_app_a_accessing_org_a(self, user_a_app_a, org_a, privilege):
        """User with App role trying to access organization-level privileges"""
        assert not can_access(user_a_app_a.application_user.user, privilege, org_a)

    # Application
    def test_get_roles_for_app_no_role(self, user, app):
        """User has no application role; should return an empty list"""
        res = get_roles_for_app(user, app)
        assert not res

    def test_get_app_roles(self, user_a_org_a, user_a_app_a, org_a, org_role_privileges):
        """Application is owned by an org for which a user has organization and application role. Should return both roles"""
        user = user_a_app_a.application_user.user
        OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=org_a, user=user),
            role=org_role_privileges,
        )

        result = get_roles_for_app(user, user_a_app_a.application_user.application)

        assert len(result) == 2
        assert set([role.role_id for role in result]) == set(
            [user_a_org_a.role_id, user_a_app_a.role_id]
        )

    @pytest.mark.parametrize("privilege", [{p} for p in APP_PRIVILEGES])
    def test_user_a_org_a_accessing_app_a(self, user_a_org_a, app_owned_by_org_a, privilege):
        """User with Org role accessing application owned by their org"""
        user = user_a_org_a.organization_user.user
        assert can_access(user, privilege, app_owned_by_org_a)

    @pytest.mark.parametrize("privilege", [{p} for p in APP_PRIVILEGES])
    def test_user_a_org_a_accessing_app_b(self, user_a_org_a, app_owned_by_org_b, privilege):
        """User with Org role accessing application owned by another org"""
        assert not can_access(user_a_org_a.organization_user.user, privilege, app_owned_by_org_b)

    @pytest.mark.parametrize("privilege", [{p} for p in APP_PRIVILEGES])
    def test_user_a_app_a_accessing_app_b(self, user_a_app_a, app_owned_by_org_b, privilege):
        """User with App role trying to access a different app"""
        assert not can_access(user_a_app_a.application_user.user, privilege, app_owned_by_org_b)

    @pytest.mark.parametrize("privilege", [{p} for p in APP_PRIVILEGES])
    def test_user_a_app_b_accessing_app_b(self, user_b_app_b, app_owned_by_org_b, privilege):
        """User with App role accessing their assigned app"""
        assert can_access(user_b_app_b.application_user.user, privilege, app_owned_by_org_b)

    @pytest.mark.parametrize("privilege", [{p} for p in APP_PRIVILEGES])
    def test_app_user_accessing_standalone_app(self, app, app_role_privileges, privilege):
        """User with App role accessing their app not owned by any org"""
        app_user_role = ApplicationUserRoleFactory(
            application_user=ApplicationUserFactory(application=app), role=app_role_privileges
        )
        assert can_access(app_user_role.application_user.user, privilege, app)
