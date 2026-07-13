import uuid
from collections.abc import Sequence

import grants_shared.adapters.db as db
from grants_shared.pagination.pagination_models import PaginationInfo, PaginationParams
from grants_shared.pagination.paginator import Paginator
from grants_shared.pagination.sorting_util import apply_sorting
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.db.models.user_models import User
from src.db.models.workflow_models import WorkflowAudit
from src.services.workflows.get_workflow import get_workflow_and_verify_access


class WorkflowAuditRequest(BaseModel):
    pagination: PaginationParams


def get_workflow_audits(
    db_session: db.Session,
    user: User,
    workflow_id: uuid.UUID,
    json_data: dict,
) -> tuple[Sequence[WorkflowAudit], PaginationInfo]:
    """
    Get paginated workflow audit events for a specific workflow.

    Raises:
        404: If workflow doesn't exist
        403: If user doesn't have required privilege
    """
    params = WorkflowAuditRequest.model_validate(json_data)

    # First verify the user has access to the workflow
    # This will raise appropriate errors if workflow doesn't exist or user lacks access
    get_workflow_and_verify_access(db_session, user, workflow_id)

    # Build the base query for workflow audit events
    stmt = (
        select(WorkflowAudit)
        .where(WorkflowAudit.workflow_id == workflow_id)
        .options(
            selectinload(WorkflowAudit.acting_user).options(selectinload(User.profile)),
            selectinload(WorkflowAudit.event),
        )
    )

    stmt = apply_sorting(stmt, params.pagination.sort_order, WorkflowAudit)

    # Paginate the results
    paginator: Paginator[WorkflowAudit] = Paginator(
        WorkflowAudit, stmt, db_session, page_size=params.pagination.page_size
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return paginated_results, pagination_info
