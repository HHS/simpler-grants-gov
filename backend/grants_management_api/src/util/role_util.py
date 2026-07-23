import uuid

from src.constants.lookup_constants import (
    ALLOWED_RESOURCES_FOR_PRIVILEGE,
    MgmtPrivilege,
    MgmtResourceType,
)
from src.db.models.resource_models import MgmtLinkRolePrivilege, MgmtLinkRoleResourceType, MgmtRole


def build_role(
    role_id: uuid.UUID,
    role_name: str,
    privileges: set[MgmtPrivilege],
    resource_types: set[MgmtResourceType],
) -> MgmtRole:
    """Build a role, validating that every privilege can be assigned at the role's resource types.

    A privilege may only be included in a role when the role's resource types are a subset of the
    resource types the privilege is allowed at (see ALLOWED_RESOURCES_FOR_PRIVILEGE). This prevents
    us from, for example, granting a department-only privilege on a team-level role.

    The association proxy relationships (`privileges` and `resource_types`) are not set up during
    object initialization, so we explicitly build the underlying `link_privileges` and
    `link_role_resource_types` relationships to ensure proper linkage and persistence.
    """
    link_privileges = []
    for privilege in privileges:
        allowed_resource_types = ALLOWED_RESOURCES_FOR_PRIVILEGE.get(privilege)
        if allowed_resource_types is None:
            raise ValueError(
                f"Cannot build role `{role_name}`: privilege `{privilege}` is missing from "
                "ALLOWED_RESOURCES_FOR_PRIVILEGE"
            )

        extra_resource_types = resource_types - allowed_resource_types
        if extra_resource_types:
            raise ValueError(
                f"Cannot build role `{role_name}`: privilege `{privilege}` is not allowed for "
                f"resource type(s): {','.join(sorted(extra_resource_types))}"
            )

        link_privileges.append(
            MgmtLinkRolePrivilege(mgmt_role_id=role_id, mgmt_privilege=privilege)
        )

    return MgmtRole(
        mgmt_role_id=role_id,
        role_name=role_name,
        is_core=True,
        link_privileges=link_privileges,
        link_role_resource_types=[
            MgmtLinkRoleResourceType(mgmt_role_id=role_id, mgmt_resource_type=resource_type)
            for resource_type in resource_types
        ],
    )
