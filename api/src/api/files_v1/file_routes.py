import logging
import uuid

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
import src.api.files_v1.file_schemas as file_schemas
import src.api.response as response
from src.api.files_v1.file_blueprint import file_blueprint
from src.auth.api_user_key_auth import api_user_key_auth
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.files.update_pending_file_scan_status import update_pending_file_scan_status

logger = logging.getLogger(__name__)


@file_blueprint.post("/<uuid:pending_file_id>")
@file_blueprint.input(file_schemas.FileScanStatusUpdateRequestSchema, location="json")
@file_blueprint.output(file_schemas.FileScanStatusUpdateResponseSchema)
@file_blueprint.doc(hide=True)
@file_blueprint.auth_required(api_user_key_auth)
@flask_db.with_db_session()
def update_file_scan_status(
    db_session: db.Session, pending_file_id: uuid.UUID, json_data: dict
) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"pending_file_id": pending_file_id})
    logger.info("POST /v1/files/<pending_file_id>")

    with db_session.begin():
        user = api_user_key_auth.get_user()
        db_session.add(user)

        update_pending_file_scan_status(
            db_session, pending_file_id, json_data["file_scan_status"], user
        )

    return response.ApiResponse(message="Success")
