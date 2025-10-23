from uuid import UUID

from sqlalchemy import select

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.api.users.user_schemas import ResourceSchema
from src.auth.endpoint_access_util import can_access
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Application
from src.db.models.entity_models import Organization
from src.db.models.user_models import User

# Map ResourceSchema to models
RESOURCE_MAP = {
    ResourceSchema.AGENCY: (Agency, Agency.agency_id),
    ResourceSchema.APPLICATION: (Application, Application.application_id),
    ResourceSchema.ORGANIZATION: (Organization, Organization.organization_id),
}


def _get_resource(
    db_session: db.Session, resource_type: ResourceSchema, resource_id: UUID
) -> Organization | Application | Agency:

    model, id_field = RESOURCE_MAP[resource_type]
    stmt = select(model).where(id_field == resource_id)

    resource = db_session.execute(stmt).scalar_one_or_none()
    if not resource:
        raise_flask_error(404, f"Resource ID {resource_id} of type {resource_type} not found")

    return resource


def check_user_can_access(db_session: db.Session, user: User, json_data: dict) -> None:
    resource = _get_resource(db_session, json_data["resource_type"], json_data["resource_id"])
    if not can_access(user, set(json_data["privileges"]), resource):
        raise_flask_error(403, "Forbidden")
