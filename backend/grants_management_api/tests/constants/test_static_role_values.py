from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.constants.static_role_values import CORE_ROLES

# The privileges each core role is expected to grant, keyed by role name.
EXPECTED_ROLE_PRIVILEGES = {
    "Department Admin": {
        MgmtPrivilege.VIEW_DEPARTMENT,
        MgmtPrivilege.UPDATE_DEPARTMENT,
        MgmtPrivilege.MANAGE_DEPARTMENT_MEMBERS,
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.UPDATE_SUBAGENCY,
        MgmtPrivilege.MANAGE_SUBAGENCY_MEMBERS,
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
        MgmtPrivilege.CREATE_TEAM,
        MgmtPrivilege.DELETE_TEAM,
    },
    "Department Viewer": {
        MgmtPrivilege.VIEW_DEPARTMENT,
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.VIEW_TEAM,
    },
    "Subagency Admin": {
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.UPDATE_SUBAGENCY,
        MgmtPrivilege.MANAGE_SUBAGENCY_MEMBERS,
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
        MgmtPrivilege.CREATE_TEAM,
        MgmtPrivilege.DELETE_TEAM,
    },
    "Subagency Viewer": {
        MgmtPrivilege.VIEW_SUBAGENCY,
        MgmtPrivilege.VIEW_TEAM,
    },
    "Team Admin": {
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.UPDATE_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
    "Team Viewer": {
        MgmtPrivilege.VIEW_TEAM,
    },
    "Team User Manager": {
        MgmtPrivilege.VIEW_TEAM,
        MgmtPrivilege.MANAGE_TEAM_MEMBERS,
    },
}

EXPECTED_ROLE_RESOURCE_TYPES = {
    "Department Admin": {MgmtResourceType.DEPARTMENT},
    "Department Viewer": {MgmtResourceType.DEPARTMENT},
    "Subagency Admin": {MgmtResourceType.SUBAGENCY},
    "Subagency Viewer": {MgmtResourceType.SUBAGENCY},
    "Team Admin": {MgmtResourceType.TEAM},
    "Team Viewer": {MgmtResourceType.TEAM},
    "Team User Manager": {MgmtResourceType.TEAM},
}


def test_core_roles_defines_exactly_seven_roles():
    assert len(CORE_ROLES) == 7
    assert {role.role_name for role in CORE_ROLES} == set(EXPECTED_ROLE_PRIVILEGES.keys())


def test_core_roles_have_expected_privileges_and_resource_types():
    for role in CORE_ROLES:
        assert role.is_core is True
        assert set(role.privileges) == EXPECTED_ROLE_PRIVILEGES[role.role_name]
        assert set(role.resource_types) == EXPECTED_ROLE_RESOURCE_TYPES[role.role_name]


def test_core_roles_have_unique_ids():
    role_ids = [role.mgmt_role_id for role in CORE_ROLES]
    assert len(role_ids) == len(set(role_ids))
