import logging
import uuid

import src.adapters.db as db
from src.adapters.db import flask_db
from src.api import response
from src.api.workflows.workflow_blueprint import workflow_blueprint
from src.api.workflows.workflow_schemas import (
    WorkflowEventRequestSchema,
    WorkflowEventResponseSchema,
    WorkflowGetResponseSchema,
)
from src.auth.multi_auth import jwt_or_api_user_key_multi_auth, jwt_or_api_user_key_security_schemes
from src.logging.flask_logger import add_extra_data_to_current_request_logs
from src.services.workflows.get_workflow import (
    build_workflow_approval_config,
    get_workflow_for_user,
)
from src.services.workflows.ingest_workflow_event import ingest_workflow_event
from src.workflow.service.approval_service import _get_agency_for_workflow

logger = logging.getLogger(__name__)


@workflow_blueprint.put("/events")
@workflow_blueprint.input(WorkflowEventRequestSchema)
@workflow_blueprint.output(WorkflowEventResponseSchema)
@workflow_blueprint.doc(
    summary="Send Workflow Event",
    description="Trigger a new workflow or progress an existing one.",
    security=jwt_or_api_user_key_security_schemes,
    responses=[200, 401, 403, 404, 422],
)
@jwt_or_api_user_key_multi_auth.login_required
@flask_db.with_db_session()
def workflow_event_put(db_session: db.Session, json_data: dict) -> response.ApiResponse:

    add_extra_data_to_current_request_logs({"event_type": json_data.get("event_type")})
    logger.info("PUT /v1/workflows/events")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        event_id = ingest_workflow_event(db_session, json_data, user)

    return response.ApiResponse(message="Event received", data={"event_id": event_id})


@workflow_blueprint.get("/<uuid:workflow_id>")
@workflow_blueprint.output(WorkflowGetResponseSchema)
@workflow_blueprint.doc(
    summary="Get Workflow Details",
    description="Retrieve detailed information about a specific workflow including audit history, approvals, and approval configuration. Access is controlled by entity-based privileges (VIEW_OPPORTUNITY or VIEW_APPLICATION).",
    security=jwt_or_api_user_key_security_schemes,
    responses=[200, 401, 403, 404],
)
@jwt_or_api_user_key_multi_auth.login_required
@flask_db.with_db_session()
def workflow_get(db_session: db.Session, workflow_id: uuid.UUID) -> response.ApiResponse:
    add_extra_data_to_current_request_logs({"workflow_id": str(workflow_id)})
    logger.info("GET /v1/workflows/:workflow_id")

    with db_session.begin():
        user = jwt_or_api_user_key_multi_auth.get_user()
        db_session.add(user)

        workflow = get_workflow_for_user(db_session, user, workflow_id)

        agency = _get_agency_for_workflow(workflow)

        approval_config = build_workflow_approval_config(db_session, workflow, agency)

        data = {
            "workflow_id": workflow.workflow_id,
            "workflow_type": workflow.workflow_type,
            "current_workflow_state": workflow.current_workflow_state,
            "is_active": workflow.is_active,
            "created_at": workflow.created_at,
            "updated_at": workflow.updated_at,
            "workflow_audit_events": workflow.workflow_audits,
            "workflow_approvals": workflow.workflow_approvals,
            "workflow_approval_config": approval_config,
            "opportunity_id": workflow.opportunity_id,
            "application_id": workflow.application_id,
            "application_submission_id": workflow.application_submission_id,
        }

    return response.ApiResponse(message="Success", data=data)
