import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.internal.internal_schema as internal_schema
import src.api.response as response
from src.api.internal.internal_blueprint import internal_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.internal.update_internal_user_role import update_internal_user_role

logger = logging.getLogger(__name__)


@internal_blueprint.put("/roles")
@internal_blueprint.input(internal_schema.InternalRoleAssignmentRequestSchema, location="json")
@internal_blueprint.output(internal_schema.InternalRoleAssignmentResponseSchema)
@internal_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def update_internal_roles(db_session: db.Session, json_data: dict) -> response.ApiResponse:
    internal_role_id = str(json_data.get("internal_role_id"))
    user_email = str(json_data.get("user_email"))

    add_extra_data_to_current_request_logs({"internal_role_id": internal_role_id})
    logger.info("PUT /v1/internal/roles")

    user = api_user_key_auth.get_user()
    db_session.add(user)
    verify_access(user, {Privilege.MANAGE_INTERNAL_ROLES}, None)

    update_internal_user_role(db_session, internal_role_id, user_email)

    return response.ApiResponse(message="Success")
