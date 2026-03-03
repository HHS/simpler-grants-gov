import logging

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.workflows.workflow_blueprint import workflow_blueprint
from src.api.workflows.workflow_schemas import (
    WorkflowEventRequestSchema,
    WorkflowEventResponseSchema,
)
from src.auth.multi_auth import jwt_or_user_api_key_multi_auth, jwt_or_user_api_key_security_schemes
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.workflows.ingest_workflow_event import ingest_workflow_event

logger = logging.getLogger(__name__)


@workflow_blueprint.put("/events")
@workflow_blueprint.input(WorkflowEventRequestSchema)
@workflow_blueprint.output(WorkflowEventResponseSchema)
@workflow_blueprint.doc(
    summary="Send Workflow Event",
    description="Trigger a new workflow or progress an existing one.",
    security=jwt_or_user_api_key_security_schemes,
    responses=[200, 401, 403, 404, 422],
)
@jwt_or_user_api_key_multi_auth.login_required
@flask_db.with_db_session()
def workflow_event_put(db_session: db.Session, json_data: dict) -> response.ApiResponse:

    add_extra_data_to_current_request_logs({"event_type": json_data.get("event_type")})
    logger.info("PUT /v1/workflows/events")

    with db_session.begin():
        event_id = ingest_workflow_event(db_session, json_data)

    return response.ApiResponse(message="Event received", data={"event_id": event_id})
