from apiflask import HTTPError
from grants_shared.adapters import db

from src.auth.authorization_enforcer import AuthorizationEnforcer
from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.db.models.resource_models import MgmtRole, AbstractResourceTableMixin
from src.db.models.user_models import MgmtUser
from tests.db.models.factories import MgmtUserFactory, DepartmentFactory, SubagencyFactory, TeamFactory, \
    MgmtRoleFactory, MgmtResourceUserFactory, MgmtInternalResourceFactory, MgmtResourceUserRoleFactory
import pytest


######################################
# Resource Fixtures
######################################
#
# This is the hierarchy of the test data used in this file:
#
# Department          A                   B
#                   /  \                  |
# Subagency        X    Y                 Z
#                 / \    \                |
# Team           1   2    3               4
#
# ---
# Any internal resources are separate from the hierarchy.

@pytest.fixture()
def department_a(enable_factory_create):
    return DepartmentFactory.create(department_name="Department A")

@pytest.fixture()
def department_b(enable_factory_create):
    return DepartmentFactory.create(department_name="Department B")

@pytest.fixture()
def subagency_x(department_a):
    return SubagencyFactory.create(subagency_name="Subagency X", department=department_a)

@pytest.fixture()
def subagency_y(department_a):
    return SubagencyFactory.create(subagency_name="Subagency Y", department=department_a)

@pytest.fixture()
def subagency_z(department_b):
    return SubagencyFactory.create(subagency_name="Subagency Z", department=department_b)

@pytest.fixture()
def team1(subagency_x):
    return TeamFactory.create(team_name="Team 1", subagency=subagency_x)

@pytest.fixture()
def team2(subagency_x):
    return TeamFactory.create(team_name="Team 2", subagency=subagency_x)

@pytest.fixture()
def team3(subagency_y):
    return TeamFactory.create(team_name="Team 3", subagency=subagency_y)

@pytest.fixture()
def team4(subagency_z):
    return TeamFactory.create(team_name="Team 4", subagency=subagency_z)

@pytest.fixture()
def internal_resource1(enable_factory_create):
    return MgmtInternalResourceFactory.create(internal_resource_name="Internal Resource 1")

@pytest.fixture()
def internal_resource2(enable_factory_create):
    return MgmtInternalResourceFactory.create(internal_resource_name="Internal Resource 2")


######################################
# Tests
######################################

# TODO - move this somewhere

def setup_user_with_roles(db_session: db.Session, resources: list[AbstractResourceTableMixin], user: MgmtUser | None = None, *, roles: list[MgmtRole] | None = None, privileges: list[MgmtPrivilege] | None = None):
    if user is None:
        user = MgmtUserFactory.create()

    if roles is None and privileges is None:
        raise Exception("One of roles or privileges is required for setup_user_with_roles")
    if roles is not None and privileges is not None:
        raise Exception("Exactly one of roles or privileges is required for setup_user_with_roles")

    resource_types = {r.get_resource_type() for r in resources}

    # If privileges were passed in, use those to make a role
    if privileges is not None:
        roles = [MgmtRoleFactory.create(privileges=privileges, resource_types=resource_types)]

    # Create a connection to every resource passed in
    for resource in resources:

        resource_user = MgmtResourceUserFactory.create(mgmt_resource=resource.resource, mgmt_user=user, resource_user_roles=[])
        for role in roles:
            MgmtResourceUserRoleFactory.create(mgmt_resource_user=resource_user, mgmt_role=role)

    # Make any subsequent calls with these objects go back to the DB.
    db_session.expire_all()

    return user



def test_user_with_no_roles_cannot_access_anything(db_session, department_a, department_b, subagency_x, subagency_y, subagency_z, team1, team2, team3, team4, internal_resource1, internal_resource2):
    user = MgmtUserFactory.create()

    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, department_a) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, department_b) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, subagency_x) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, subagency_y) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, subagency_z) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team2) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team3) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team4) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource2) is False

def test_user_department_level(db_session, department_a, department_b, subagency_x, team1, internal_resource1):

    user = setup_user_with_roles(db_session, resources=[department_a], privileges=[MgmtPrivilege.VIEW_DEPARTMENT])

    # User can view their department
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, department_a) is True
    # User doesn't have access to edit the department
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_DEPARTMENT}, department_a) is False
    # User only has part of these privileges, so is denied
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT, MgmtPrivilege.UPDATE_DEPARTMENT}, department_a) is False

    # User cannot view another department
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, department_b) is False
    # While these aren't checks we'd realistically do,
    # if view_department against a subagency or team were asked,
    # a user could technically do it
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, subagency_x) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, team1) is True
    # No hierarchy gets to internal resources
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, internal_resource1) is False


def test_user_subagency_level(db_session, department_a, subagency_x, subagency_y, team1, internal_resource1):
    user = setup_user_with_roles(db_session, resources=[subagency_x], privileges=[MgmtPrivilege.VIEW_SUBAGENCY])

    # User can view their subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, subagency_x) is True
    # User does not have access to edit the subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_SUBAGENCY}, subagency_x) is False
    # User only has part of these privileges, so is denied
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY, MgmtPrivilege.UPDATE_SUBAGENCY}, subagency_x) is False

    # User cannot view another subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, subagency_y) is False

    # Not realistic to ask to view a subagency against department/team, but if asked:
    # User cannot view subagency against the parent department
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, department_a) is False
    # User could view subagency against the team under the subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, team1) is True

    # No hierarchy gets to internal resources
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_SUBAGENCY}, internal_resource1) is False

def test_user_team_level(db_session, department_a, subagency_x, team1, team2, internal_resource1):
    user = setup_user_with_roles(db_session, resources=[team1], privileges=[MgmtPrivilege.VIEW_TEAM])

    # User can view their team
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team1) is True
    # User does not have access to edit the team
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, team1) is False
    # User only has part of these privileges, so is denied
    assert AuthorizationEnforcer(db_session).can_access(user,{MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, team1) is False

    # User cannot view another team
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team2) is False

    # Not realistic to ask to view a team against department/subagency, but if asked:
    # User cannot view team against the grandparent department
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, department_a) is False
    # User cannot view team against the parent subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, subagency_x) is False

    # No hierarchy gets to internal resources
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM},
                                                        internal_resource1) is False


def test_user_internal_resource(db_session, internal_resource1, internal_resource2, department_a, subagency_x, team1):
    user = setup_user_with_roles(db_session, resources=[internal_resource1], privileges=[MgmtPrivilege.VIEW_TEAM])

    # User can do view_team against their internal resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource1) is True
    # User cannot do another action against their internal resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is False
    # User only has part of these privileges, so is denied
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is False

    # User cannot view another internal resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource2) is False

    # The internal resource isn't connected to any of these, so cannot access them
    for resource in [department_a, subagency_x, team1]:
        assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, resource) is False

def test_user_with_multiple_privileges_in_role(db_session, internal_resource1, internal_resource2):
    user = setup_user_with_roles(db_session, resources=[internal_resource1], privileges=[MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM])

    # User can view/update or both at the same time against their resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is True

    # Cannot do any other privileges, even with a partial overlap
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.CREATE_TEAM}, internal_resource1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM, MgmtPrivilege.DELETE_TEAM}, internal_resource1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, internal_resource1) is False

    # Cannot do those against another resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource2) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, internal_resource2) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, internal_resource2) is False


def test_user_with_privileges_across_roles(db_session, internal_resource1, internal_resource2):
    """Same as test_user_with_multiple_privileges_in_role but the privilege is split across roles"""
    role1 = MgmtRoleFactory.create(privileges=[MgmtPrivilege.VIEW_TEAM], resource_types=[MgmtResourceType.INTERNAL])
    role2 = MgmtRoleFactory.create(privileges=[MgmtPrivilege.UPDATE_TEAM], resource_types=[MgmtResourceType.INTERNAL])
    user = setup_user_with_roles(db_session, resources=[internal_resource1], roles=[role1, role2])

    # User can view/update or both at the same time against their resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, internal_resource1) is True

    # Cannot do any other privileges, even with a partial overlap
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.CREATE_TEAM}, internal_resource1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM, MgmtPrivilege.DELETE_TEAM}, internal_resource1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, internal_resource1) is False

    # Cannot do those against another resource
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, internal_resource2) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, internal_resource2) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}, internal_resource2) is False

def test_user_with_multiple_roles_at_different_levels(db_session, department_a, subagency_x, team1, team2, team3, team4):

    # Has 3 different team related privileges at department/subagency/team levels
    department_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.VIEW_TEAM], resource_types=[MgmtResourceType.DEPARTMENT])
    subagency_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.UPDATE_TEAM], resource_types=[MgmtResourceType.SUBAGENCY])
    team_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.MANAGE_TEAM_MEMBERS], resource_types=[MgmtResourceType.TEAM])
    user = setup_user_with_roles(db_session, resources=[department_a], roles=[department_role])
    setup_user_with_roles(db_session, user=user, resources=[subagency_x], roles=[subagency_role])
    setup_user_with_roles(db_session, user=user, resources=[team1], roles=[team_role])

    # Can do various things at the team level through inheritance
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, team1) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team1) is True

    # Can do all of them across roles
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM, MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team1) is True

    # Cannot do other actions against the team
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.DELETE_TEAM}, team1) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.CREATE_TEAM}, team1) is False

    # Can do the actions from the department/subagency against a sibling team
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team2) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, team2) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team2) is False

    # Can do only actions from the department against a team in another subagency
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team3) is True
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, team3) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team3) is False

    # Cannot access other teams
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.VIEW_TEAM}, team4) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.UPDATE_TEAM}, team4) is False
    assert AuthorizationEnforcer(db_session).can_access(user, {MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team4) is False

def test_verify_access(db_session, department_a):
    user = MgmtUserFactory.create()
    with pytest.raises(HTTPError, match="Forbidden"):
        AuthorizationEnforcer(db_session).verify_access(user, {MgmtPrivilege.VIEW_DEPARTMENT}, department_a)


def test_logging(db_session, department_a, team1, subagency_x):
    """Test that logging values get populated as expected"""
    department_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.VIEW_TEAM], resource_types=[MgmtResourceType.DEPARTMENT])
    subagency_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.UPDATE_TEAM], resource_types=[MgmtResourceType.SUBAGENCY])
    team_role = MgmtRoleFactory.create(privileges=[MgmtPrivilege.MANAGE_TEAM_MEMBERS], resource_types=[MgmtResourceType.TEAM])
    user = setup_user_with_roles(db_session, resources=[department_a], roles=[department_role])
    setup_user_with_roles(db_session, user=user, resources=[subagency_x], roles=[subagency_role])
    setup_user_with_roles(db_session, user=user, resources=[team1], roles=[team_role])

    enforcer = AuthorizationEnforcer(db_session)
    enforcer.can_access(user, {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM, MgmtPrivilege.MANAGE_TEAM_MEMBERS}, team1)

    log_context = enforcer.log_context
    assert log_context["user_id"] == user.mgmt_user_id
    assert log_context["resource_type"] == MgmtResourceType.TEAM
    assert set(log_context["required_privileges"].split("|")) == {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM, MgmtPrivilege.MANAGE_TEAM_MEMBERS}
    assert log_context["relevant_team_ids"] == str(team1.team_id)
    assert log_context["relevant_subagency_ids"] == str(subagency_x.subagency_id)
    assert log_context["relevant_department_ids"] == str(department_a.department_id)
    assert log_context["relevant_role_count"] == 3
    assert set(log_context["authorizing_role_ids"].split("|")) == {str(department_role.mgmt_role_id), str(subagency_role.mgmt_role_id), str(team_role.mgmt_role_id)}
    assert set(log_context["authorizing_role_names"].split("|")) == {department_role.role_name, subagency_role.role_name, team_role.role_name}
    assert log_context["access_granted"] is True