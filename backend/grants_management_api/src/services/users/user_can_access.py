import uuid

from grants_shared.adapters import db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select
from sqlalchemy.orm import InstrumentedAttribute

from src.auth.authorization_enforcer import AuthorizationEnforcer
from src.constants.lookup_constants import MgmtPrivilege, MgmtResourceType
from src.db.models.resource_models import AbstractResourceTableMixin, Department, Subagency, Team
from src.db.models.user_models import MgmtUser

# Each resource type we support needs its own getter that fetches the resource by its ID.
RESOURCE_MAP: dict[
    MgmtResourceType, tuple[type[AbstractResourceTableMixin], InstrumentedAttribute]
] = {
    MgmtResourceType.DEPARTMENT: (Department, Department.department_id),
    MgmtResourceType.SUBAGENCY: (Subagency, Subagency.subagency_id),
    MgmtResourceType.TEAM: (Team, Team.team_id),
}


def get_resource(
    db_session: db.Session, resource_type: MgmtResourceType, resource_id: uuid.UUID
) -> AbstractResourceTableMixin:
    # An unsupported (or mismatched) type is treated the same as a missing resource so we
    # don't reveal that a resource with that ID exists as a different type.
    if resource_type not in RESOURCE_MAP:
        raise_flask_error(404, f"Resource {resource_id} of type {resource_type} not found")

    model, id_field = RESOURCE_MAP[resource_type]
    resource = db_session.execute(select(model).where(id_field == resource_id)).scalar_one_or_none()

    if resource is None:
        raise_flask_error(404, f"Resource {resource_id} of type {resource_type} not found")

    return resource


def check_user_can_access(
    db_session: db.Session,
    user: MgmtUser,
    resource_type: MgmtResourceType,
    resource_id: uuid.UUID,
    privileges: set[MgmtPrivilege],
) -> None:
    resource = get_resource(db_session, resource_type, resource_id)

    AuthorizationEnforcer(db_session).verify_access(
        user=user,
        required_privileges=privileges,
        resource=resource,
    )
