import uuid

from src.constants.lookup_constants import Privilege, RoleType
from src.db.models.user_models import LinkRolePrivilege, LinkRoleRoleType, Role

# The association proxy relationships (`privileges` and `role_types`) are not set up during
# object initialization, so when defining static Role instances, we need to explicitly
# define the underlying relationships (`link_privileges` and `link_role_types`) to ensure
# proper linkage and persistence.


def get_link_privileges(role_id: uuid.UUID, privilege: list[Privilege]) -> list[LinkRolePrivilege]:
    return [LinkRolePrivilege(role_id=role_id, privilege=priv) for priv in privilege]


ORG_ADMIN_ID = uuid.UUID("446bafb9-41ee-46ac-8584-889aedcd5142")
ORG_ADMIN = Role(
    role_id=ORG_ADMIN_ID,
    role_name="Organization Admin",
    is_core=True,
    link_privileges=get_link_privileges(
        ORG_ADMIN_ID,
        [
            Privilege.MANAGE_ORG_MEMBERS,
            Privilege.VIEW_ORG_MEMBERSHIP,
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=ORG_ADMIN_ID, role_type=RoleType.ORGANIZATION)],
)

ORG_MEMBER_ID = uuid.UUID("336a530f-a356-4fbd-85ef-bc0ce18f89c8")
ORG_MEMBER = Role(
    role_id=ORG_MEMBER_ID,
    role_name="Organization Member",
    is_core=True,
    link_privileges=get_link_privileges(
        ORG_MEMBER_ID,
        [
            Privilege.VIEW_ORG_MEMBERSHIP,
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
        ],
    ),
    link_role_types=[LinkRoleRoleType(role_id=ORG_MEMBER_ID, role_type=RoleType.ORGANIZATION)],
)
APPLICATION_OWNER_ID = uuid.UUID("f1e72876-ad13-4734-be5c-b43c8cef8d67")
APPLICATION_OWNER = Role(
    role_id=APPLICATION_OWNER_ID,
    role_name="Application Owner",
    is_core=True,
    link_privileges=get_link_privileges(
        APPLICATION_OWNER_ID,
        [
            Privilege.START_APPLICATION,
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
            Privilege.SUBMIT_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=APPLICATION_OWNER_ID, role_type=RoleType.APPLICATION)
    ],
)

APPLICATION_CONTRIBUTOR_ID = uuid.UUID("d8c73cba-e4c9-4d3f-b661-b79609d4b7dd")
APPLICATION_CONTRIBUTOR = Role(
    role_id=APPLICATION_CONTRIBUTOR_ID,
    role_name="Application Contributor",
    is_core=True,
    link_privileges=get_link_privileges(
        APPLICATION_CONTRIBUTOR_ID,
        [
            Privilege.LIST_APPLICATION,
            Privilege.VIEW_APPLICATION,
            Privilege.MODIFY_APPLICATION,
        ],
    ),
    link_role_types=[
        LinkRoleRoleType(role_id=APPLICATION_CONTRIBUTOR_ID, role_type=RoleType.APPLICATION)
    ],
)

CORE_ROLES = [ORG_ADMIN, ORG_MEMBER, APPLICATION_OWNER, APPLICATION_CONTRIBUTOR]
