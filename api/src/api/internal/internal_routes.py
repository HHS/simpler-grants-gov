import logging
import uuid

import grants_shared.adapters.db as db
import grants_shared.adapters.db.flask_db as flask_db
import grants_shared.api.response as response
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

import src.api.internal.internal_schema as internal_schema
from src.api.internal.internal_blueprint import internal_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.services.internal.create_e2e_token import create_e2e_token
from src.services.internal.setup_file_scan_scanner_user import setup_file_scan_scanner_user
from src.services.internal.update_internal_user_role import update_internal_user_role

logger = logging.getLogger(__name__)


@internal_blueprint.put("/roles")
@internal_blueprint.input(internal_schema.InternalRoleAssignmentRequestSchema, location="json")
@internal_blueprint.output(internal_schema.InternalRoleAssignmentResponseSchema)
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


@internal_blueprint.post("/file-scan-scanner-user")
@internal_blueprint.input(internal_schema.FileScanScannerUserRequestSchema, location="json")
@internal_blueprint.output(internal_schema.FileScanScannerUserResponseSchema)
@internal_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def setup_file_scan_scanner_user_route(
    db_session: db.Session, json_data: dict
) -> response.ApiResponse:
    """
    Provision the internal user the file-scan scanner Lambda authenticates as,
    along with its INTERNAL_S3_SCAN role, then mint and return a fresh API key.
    Re-running rotates the key for the same user. Gated on the
    manage_internal_roles privilege.
    """
    scanner_user_id = json_data["user_id"]

    add_extra_data_to_current_request_logs({"scanner_user_id": scanner_user_id})
    logger.info("POST /v1/internal/file-scan-scanner-user")

    with db_session.begin():
        api_key_user = api_user_key_auth.get_user()
        db_session.add(api_key_user)

        scanner_api_key = setup_file_scan_scanner_user(db_session, api_key_user, scanner_user_id)

        # Capture the generated key value while the row is still attached; this
        # is the one and only time the plaintext key leaves the system.
        data = {
            "user_id": scanner_user_id,
            "api_key_id": scanner_api_key.api_key_id,
            "api_key": scanner_api_key.key_id,
        }

    return response.ApiResponse(message="Success", data=data)


@internal_blueprint.post("/e2e-token")
@internal_blueprint.input(internal_schema.E2ETokenRequestSchema, location="json")
@internal_blueprint.output(internal_schema.E2ETokenResponseSchema)
@internal_blueprint.doc(hide=True)
@internal_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def get_e2e_token(db_session: db.Session, json_data: dict[str, uuid.UUID]) -> response.ApiResponse:
    """
    Endpoint to fetch a viable auth token for a test user account.
    Only accessible via API key auth with the manage_test_user_token privilege,
    and only in lower environments.
    """
    target_user_id = json_data["user_id"]

    add_extra_data_to_current_request_logs({"target_user_id": target_user_id})
    logger.info("POST /v1/internal/e2e-token")

    with db_session.begin():
        api_key_user = api_user_key_auth.get_user()
        db_session.add(api_key_user)

        token_data = create_e2e_token(db_session, api_key_user, target_user_id)

    return response.ApiResponse(message="Success", data=token_data)
