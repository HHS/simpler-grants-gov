import logging
from uuid import UUID

import grants_shared.adapters.db as db
import grants_shared.adapters.db.flask_db as flask_db
from grants_shared.api import response
from grants_shared.logs.flask_logger import add_extra_data_to_current_request_logs

from src.api.application_v1.application_blueprint import application_v1_blueprint
from src.api.application_v1.application_schemas import (
    ApplicationAttachmentCreateRequestSchema,
    ApplicationAttachmentCreateResponseSchema,
)
from src.auth.api_jwt_auth import api_jwt_auth
from src.services.applications.create_application_attachment_from_pending_file import (
    create_application_attachment_from_pending_file,
)

logger = logging.getLogger(__name__)


@application_v1_blueprint.post("/applications/<uuid:application_id>/attachments")
@application_v1_blueprint.input(ApplicationAttachmentCreateRequestSchema(), location="json")
@application_v1_blueprint.output(ApplicationAttachmentCreateResponseSchema())
@application_v1_blueprint.doc(responses=[200, 401, 403, 404, 422])
@application_v1_blueprint.auth_required(api_jwt_auth)
@flask_db.with_db_session()
def application_attachment_create(
    db_session: db.Session, application_id: UUID, json_data: dict
) -> response.ApiResponse:
    """Create an application attachment from a pending (virus-scanned) file"""
    add_extra_data_to_current_request_logs({"application_id": application_id})
    logger.info("POST /v1/applications/:application_id/attachments")

    token_session = api_jwt_auth.get_user_token_session()
    user = token_session.user

    with db_session.begin():
        db_session.add(token_session)
        application_attachment = create_application_attachment_from_pending_file(
            db_session=db_session,
            application_id=application_id,
            user=user,
            pending_file_id=json_data["pending_file_id"],
        )

    return response.ApiResponse(message="Success", data=application_attachment)
