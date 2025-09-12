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
)


@pytest.fixture
def app():
    return ApplicationFactory()


@pytest.fixture
def org():
    return OrganizationFactory.create()


@pytest.fixture
def app_owned_by_org(org):
    return ApplicationFactory(with_organization=org)


@pytest.fixture
def org_user(app_owned_by_org):
    return OrganizationUserFactory(organization=app_owned_by_org.organization)


@pytest.fixture
def user_org_role(org_user):
    return OrganizationUserRoleFactory(organization_user=org_user)


@pytest.fixture
def app_user(app):
    return ApplicationUserFactory(application=app)


@pytest.fixture
def user_app_role(app_user):
    return ApplicationUserRoleFactory(application_user=app_user)


class TestEndpointAccessUtil(BaseTestClass):

    # Organization
    def test_get_roles_for_org_no_role(self, user, org):
        """User has no organization role; should return an empty list"""
        res = get_roles_for_org(user, org)
        assert not res

    def test_get_roles_for_org_has_role(self, app_owned_by_org, user_org_role):
        """User has a role in the organization  should return a non-empty list"""
        res = get_roles_for_org(user_org_role.organization_user.user, app_owned_by_org.organization)
        assert res

    def test_get_roles_for_org_multiple_orgs(self, org_user, user_org_role, enable_factory_create):
        """Set up user with two org links; only one matches the target org"""
        user = org_user.user
        OrganizationUserRoleFactory(organization_user=OrganizationUserFactory(user=user))

        result = get_roles_for_org(user, org_user.organization)
        assert result == [user_org_role.role]

    @pytest.mark.parametrize(
        "allowed_privilege",
        [
            # org role privileges
            ({Privilege.MODIFY_APPLICATION}),
            ({Privilege.SUBMIT_APPLICATION}),
            ({Privilege.MANAGE_ORG_MEMBERS}),
            ({Privilege.MANAGE_ORG_ADMIN_MEMBERS}),
            ({Privilege.VIEW_ORG_MEMBERSHIP}),
        ],
    )
    def test_can_access_organization_granted(
        self, user_org_role, app_owned_by_org, allowed_privilege
    ):
        assert can_access(
            user_org_role.organization_user.user, allowed_privilege, app_owned_by_org.organization
        )

    def test_can_access_organization_denied(
        self,
        user_app_role,
        app_owned_by_org,
    ):
        assert not can_access(
            user_app_role.application_user.user,
            {Privilege.VIEW_ORG_MEMBERSHIP},
            app_owned_by_org.organization,
        )

    # Application

    def test_get_roles_for_app_no_role(self, user, app):
        """User has no application role; should return an empty list"""
        res = get_roles_for_app(user, app)
        assert not res

    def test_get_roles_for_app_has_role(self, app_user, user_app_role):
        """User has a role on the application; should return non-empty list"""
        res = get_roles_for_app(app_user.user, app_user.application)
        assert res

    def test_get_roles_for_app_multiple_users(self, app_user, user_app_role, enable_factory_create):
        # Set up an application with two users
        application = app_user.application
        # Add a second ApplicationUser link for the same application but different user
        ApplicationUserFactory(application=application)
        result = get_roles_for_app(app_user.user, application)
        assert result == [user_app_role.role]

    def test_get_roles_for_app_with_org_role_only(self, app_owned_by_org, user_org_role):
        """
        User has a role in the organization that owns the application,
        but is not directly assigned to the application. get_roles_for_app should return the org-based roles.
        """
        user = user_org_role.organization_user.user
        app = app_owned_by_org

        # Make sure the user is NOT linked to the application directly
        assert all(app_user.user != user for app_user in app.application_users)

        result = get_roles_for_app(user, app)

        # Should return the user's org roles since the app is owned by the org
        expected_roles = user_org_role.organization_user.roles
        assert result == expected_roles

    @pytest.mark.parametrize(
        "allowed_privilege",
        [
            # application role privileges
            ({Privilege.VIEW_APPLICATION}),
            ({Privilege.SUBMIT_APPLICATION}),
            ({Privilege.MODIFY_APPLICATION}),
        ],
    )
    def test_can_access_application_granted(self, user_app_role, app_user, allowed_privilege):
        assert can_access(
            user_app_role.application_user.user, allowed_privilege, app_user.application
        )

    def test_can_access_application_denied(self, app_user):
        # User has no role, access to app should be denied
        assert not can_access(app_user.user, {Privilege.MODIFY_APPLICATION}, app_user.application)
