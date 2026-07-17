import uuid

import pytest

from src.constants.lookup_constants import (
    ALLOWED_RESOURCES_FOR_PRIVILEGE,
    MgmtPrivilege,
    MgmtResourceType,
)
from src.constants.static_role_values import CORE_ROLES, build_role

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


def test_allowed_resources_for_privilege_is_complete():
    # Every privilege must be mapped so build_role can validate it.
    assert set(ALLOWED_RESOURCES_FOR_PRIVILEGE.keys()) == set(MgmtPrivilege)


def test_build_role_sets_privileges_and_resource_types():
    role_id = uuid.uuid4()
    role = build_role(
        role_id=role_id,
        role_name="Test Team Role",
        privileges={MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM},
        resource_types={MgmtResourceType.TEAM},
    )

    assert role.mgmt_role_id == role_id
    assert role.role_name == "Test Team Role"
    assert role.is_core is True
    assert set(role.privileges) == {MgmtPrivilege.VIEW_TEAM, MgmtPrivilege.UPDATE_TEAM}
    assert set(role.resource_types) == {MgmtResourceType.TEAM}
    # Every link row is stamped with the role id so the merge-based sync persists them.
    assert all(link.mgmt_role_id == role_id for link in role.link_privileges)
    assert all(link.mgmt_role_id == role_id for link in role.link_role_resource_types)


def test_build_role_rejects_privilege_not_allowed_at_resource_type():
    # delete_team is only allowed at the department/subagency level, so it cannot
    # be assigned to a team-level role.
    with pytest.raises(ValueError, match="delete_team"):
        build_role(
            role_id=uuid.uuid4(),
            role_name="Bad Team Role",
            privileges={MgmtPrivilege.DELETE_TEAM},
            resource_types={MgmtResourceType.TEAM},
        )


def test_build_role_rejects_privilege_missing_from_mapping(monkeypatch):
    monkeypatch.delitem(ALLOWED_RESOURCES_FOR_PRIVILEGE, MgmtPrivilege.VIEW_TEAM)

    with pytest.raises(ValueError, match="missing from ALLOWED_RESOURCES_FOR_PRIVILEGE"):
        build_role(
            role_id=uuid.uuid4(),
            role_name="Missing Mapping Role",
            privileges={MgmtPrivilege.VIEW_TEAM},
            resource_types={MgmtResourceType.TEAM},
        )


def test_core_roles_defines_exactly_seven_roles():
    # The tech spec calls for exactly 7 roles - "Team Contributor" is not a role.
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
