import logging

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.internal.internal_schema as internal_schema
import src.api.response as response
from src.api.internal.internal_blueprint import internal_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.internal.create_e2e_token import create_e2e_token
from src.services.internal.update_internal_user_role import update_internal_user_role

logger = logging.getLogger(__name__)


@internal_blueprint.put("/roles")
@internal_blueprint.input(internal_schema.InternalRoleAssignmentRequestSchema, location="json")
@internal_blueprint.output(internal_schema.InternalRoleAssignmentResponseSchema)
@internal_blueprint.doc(hide=True)
@internal_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def update_internal_roles(
    db_session: db.Session, json_data: dict[str, str]
) -> response.ApiResponse:
    internal_role_id = json_data.get("internal_role_id", "")
    user_email = json_data.get("user_email", "")

    add_extra_data_to_current_request_logs({"internal_role_id": internal_role_id})
    logger.info("PUT /v1/internal/roles")

    with db_session.begin():
        user = api_user_key_auth.get_user()
        db_session.add(user)

        update_internal_user_role(db_session, internal_role_id, user_email, user)

    return response.ApiResponse(message="Success")


@internal_blueprint.post("/e2e-token")
@internal_blueprint.output(internal_schema.E2ETokenResponseSchema)
@internal_blueprint.doc(hide=True)
@internal_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def get_e2e_token(db_session: db.Session) -> response.ApiResponse:
    """
    Endpoint to fetch a viable auth token for a test user account.
    Only accessible via API key auth with the read_test_user_token privilege.
    """
    logger.info("POST /v1/internal/e2e-token")

    with db_session.begin():
        user = api_user_key_auth.get_user()
        user = db_session.merge(user, load=False)

        token_data = create_e2e_token(db_session, user)

    return response.ApiResponse(message="Success", data=token_data)
