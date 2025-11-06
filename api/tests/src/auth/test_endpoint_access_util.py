from unittest.mock import patch

import pytest

from src.auth.endpoint_access_util import (
    can_access,
    get_roles_for_agency,
    get_roles_for_app,
    get_roles_for_org,
    get_roles_for_resource,
)
from src.constants.lookup_constants import Privilege
from tests.conftest import BaseTestClass, db_session
from tests.src.db.models.factories import (
    AgencyFactory,
    AgencyUserFactory,
    AgencyUserRoleFactory,
    ApplicationFactory,
    ApplicationUserFactory,
    ApplicationUserRoleFactory,
    InternalUserRoleFactory,
    OrganizationFactory,
    OrganizationUserFactory,
    OrganizationUserRoleFactory,
    RoleFactory,
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

INTERNAL_PRIVILEGES = [Privilege.UPDATE_FORM]
AGENCY_PRIVILEGES = [Privilege.MANAGE_AGENCY_MEMBERS, Privilege.GET_SUBMITTED_APPLICATIONS]


class TestEndpointAccessUtil(BaseTestClass):
    # Resources
    @pytest.fixture(scope="class")
    def agency_a(self, enable_factory_create):
        return AgencyFactory()

    @pytest.fixture(scope="class")
    def agency_b(self, enable_factory_create):
        return AgencyFactory()

    @pytest.fixture(scope="class")
    def org_a(self, enable_factory_create):
        return OrganizationFactory()

    @pytest.fixture(scope="class")
    def org_b(self, enable_factory_create):
        return OrganizationFactory()

    @pytest.fixture(scope="class")
    def app(self, enable_factory_create):
        return ApplicationFactory()

    @pytest.fixture(scope="class")
    def app_owned_by_org_a(self, org_a):
        return ApplicationFactory(organization=org_a)

    @pytest.fixture(scope="class")
    def app_owned_by_org_b(self, org_b):
        return ApplicationFactory(organization=org_b)

    # Privileges
    @pytest.fixture(scope="class")
    def org_role_privileges(self):
        return RoleFactory(privileges=ORG_PRIVILEGES)

    @pytest.fixture(scope="class")
    def app_role_privileges(self):
        return RoleFactory(privileges=APP_PRIVILEGES)

    @pytest.fixture(scope="class")
    def internal_role_privileges(self):
        return RoleFactory(privileges=INTERNAL_PRIVILEGES)

    @pytest.fixture(scope="class")
    def agency_role_privileges(self):
        return RoleFactory(privileges=AGENCY_PRIVILEGES)

    # Users
    @pytest.fixture(scope="class")
    def user_a_org_a(self, org_a, org_role_privileges):
        return OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=org_a), role=org_role_privileges
        )

    @pytest.fixture(scope="class")
    def user_b_org_b(self, app_owned_by_org_b, org_role_privileges):
        return OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=app_owned_by_org_b.organization),
            role=org_role_privileges,
        )

    @pytest.fixture(scope="class")
    def user_a_app_a(self, app_owned_by_org_a, app_role_privileges):
        return ApplicationUserRoleFactory(
            application_user=ApplicationUserFactory(application=app_owned_by_org_a),
            role=app_role_privileges,
        )

    @pytest.fixture(scope="class")
    def user_b_app_b(self, app_owned_by_org_b, app_role_privileges):
        return ApplicationUserRoleFactory(
            application_user=ApplicationUserFactory(application=app_owned_by_org_b),
            role=app_role_privileges,
        )

    @pytest.fixture(scope="class")
    def user_a_agency_a(self, agency_role_privileges, agency_a):
        return AgencyUserRoleFactory(
            agency_user=AgencyUserFactory(agency=agency_a),
            role=agency_role_privileges,
        )

    @pytest.fixture(scope="class")
    def user_b_agency_b(self, agency_role_privileges, agency_b):
        return AgencyUserRoleFactory(
            agency_user=AgencyUserFactory(agency=agency_b),
            role=agency_role_privileges,
        )

    @pytest.fixture(scope="class")
    def user_c_limited_app_a_priv(self, app_owned_by_org_a):
        return ApplicationUserRoleFactory(
            application_user=ApplicationUserFactory(application=app_owned_by_org_a),
            role=RoleFactory(privileges=[Privilege.VIEW_APPLICATION, Privilege.SUBMIT_APPLICATION]),
        )

    @pytest.fixture(scope="class")
    def user_d_limited_org_b_priv(self, org_b):
        return OrganizationUserRoleFactory(
            organization_user=OrganizationUserFactory(organization=org_b),
            role=RoleFactory(
                privileges=[Privilege.VIEW_ORG_MEMBERSHIP, Privilege.MANAGE_ORG_MEMBERS]
            ),
        )

    @pytest.fixture(scope="class")
    def user_e_limited_agency_b_priv(self, agency_b):
        return AgencyUserRoleFactory(
            agency_user=AgencyUserFactory(agency=agency_b),
            role=RoleFactory(privileges=[Privilege.GET_SUBMITTED_APPLICATIONS]),
        )

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

        user_orgs = user.organization_users
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

    @pytest.mark.parametrize(
        "privilege,expected",
        [
            ({Privilege.VIEW_ORG_MEMBERSHIP}, True),
            ({Privilege.MANAGE_ORG_ADMIN_MEMBERS}, False),
        ],
    )
    def test_user_c_org_a_limited_priv(self, user_d_limited_org_b_priv, org_b, privilege, expected):
        """User with limited Org privileges"""
        assert (
            can_access(user_d_limited_org_b_priv.organization_user.user, privilege, org_b)
            == expected
        )

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

    @pytest.mark.parametrize(
        "privilege,expected",
        [
            ({Privilege.SUBMIT_APPLICATION}, True),
            ({Privilege.START_APPLICATION}, False),
        ],
    )
    def test_user_c_limited_app_a_priv(
        self, user_c_limited_app_a_priv, app_owned_by_org_a, privilege, expected
    ):
        """User with limited Org privileges"""
        assert (
            can_access(
                user_c_limited_app_a_priv.application_user.user, privilege, app_owned_by_org_a
            )
            == expected
        )

    # Internal
    def test_get_internal_role(self, internal_role_privileges, app):
        """User has internal role; should be returned"""
        internal_user_role = InternalUserRoleFactory(
            role=internal_role_privileges,
        )

        result = get_roles_for_resource(internal_user_role.user, app)

        assert len(result) == 1
        assert result[0].role_id == internal_user_role.role_id

    def test_get_internal_role_access(self, internal_role_privileges, app):
        """User has required internal privilege; should be returned"""
        internal_user_role = InternalUserRoleFactory(
            role=internal_role_privileges,
        )

        assert can_access(internal_user_role.user, {INTERNAL_PRIVILEGES[0]}, app)

    # Agency
    def test_get_roles_for_agency_no_role(self, user, agency_a):
        """User has no agency role; should return an empty list"""
        res = get_roles_for_org(user, agency_a)
        assert not res

    def test_get_roles_for_correct_agency(
        self, user_a_agency_a, agency_a, agency_b, agency_role_privileges
    ):
        """User has agency roles across multiple agencies; should return only the target agency roles"""
        user = user_a_agency_a.agency_user.user
        AgencyUserRoleFactory(
            agency_user=AgencyUserFactory(agency=agency_b, user=user),
            role=agency_role_privileges,
        )

        res = get_roles_for_agency(user, agency_a)

        assert len(user.agency_users) == 2

        assert len(res) == 1
        assert res[0].role_id == user_a_agency_a.role_id

    @pytest.mark.parametrize("privilege", [{p} for p in AGENCY_PRIVILEGES])
    def test_user_a_agency_a_accessing_agency_a(self, user_a_agency_a, agency_a, privilege):
        """User with Agency role accessing their own agency"""
        assert can_access(user_a_agency_a.agency_user.user, privilege, agency_a)

    @pytest.mark.parametrize("privilege", [{p} for p in AGENCY_PRIVILEGES])
    def test_user_a_agency_a_accessing_agency_b(self, user_b_agency_b, agency_a, privilege):
        """User with Agency role accessing a different agency"""
        assert not can_access(user_b_agency_b.agency_user.user, privilege, agency_a)

    @pytest.mark.parametrize(
        "privilege,expected",
        [
            ({Privilege.GET_SUBMITTED_APPLICATIONS}, True),
            ({Privilege.MANAGE_AGENCY_MEMBERS}, False),
        ],
    )
    def test_user_e_limited_agency_b_priv(
        self, user_e_limited_agency_b_priv, agency_b, privilege, expected
    ):
        """User with limited Agency privileges"""
        assert (
            can_access(user_e_limited_agency_b_priv.agency_user.user, privilege, agency_b)
            == expected
        )
