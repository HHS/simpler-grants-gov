import math
import uuid
from collections.abc import Sequence
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.db.models.user_models import User
from src.db.models.workflow_models import WorkflowAudit
from src.pagination.pagination_models import PaginationInfo, SortOrder, SortOrderParams
from src.services.workflows.get_workflow import get_workflow_and_verify_access


class WorkflowAuditPaginationParams(BaseModel):
    sort_order: list[SortOrderParams] = Field(
        default_factory=lambda: [
            SortOrderParams(order_by="created_at", sort_direction="descending")
        ]
    )
    page_size: int = Field(default=25)
    page_offset: int = Field(default=1)


class WorkflowAuditParams(BaseModel):
    pagination: WorkflowAuditPaginationParams = Field(default_factory=WorkflowAuditPaginationParams)


def apply_sorting(items: Sequence[Any], sort_order: list[SortOrderParams]) -> Sequence[Any]:
    """
    Generic multi-field sorting for Python objects.

    Args:
        items: A sequence of Python objects
        sort_order: A list of sort rules where each rule contains:
            - order_by: attribute name (supports dotted paths like "user.email")
            - sort_direction: "ascending" | "descending"

    Returns:
        A new, sorted list of items.
    """

    # Apply sorts in reverse order
    for rule in reversed(sort_order):
        attr_path = rule.order_by
        reverse = rule.sort_direction == "descending"

        def get_value(obj: Any, path: str = attr_path) -> Any:
            """Traverse dotted attributes safely (e.g., 'user.profile.email')."""
            value = obj
            for part in path.split("."):
                value = getattr(value, part, None)
                if value is None:
                    break
            return value

        # Sort with safe handling for None (None always goes last)
        items = sorted(
            items,
            key=lambda i: (get_value(i) is None, get_value(i)),
            reverse=reverse,
        )

    return items


def paginate_audit_events(
    items: Sequence[Any], page_offset: int, page_size: int, sort_order: list[SortOrderParams]
) -> tuple[Sequence[WorkflowAudit], PaginationInfo]:
    """
    Paginate a list of Python objects.

    Args:
        items: A list of Python objects
        page_offset: The offset of the current page
        page_size: The size of the current page
        sort_order: Sorting rules applied

    Returns:
        Paginated list of items
        PaginationInfo Object
    """
    total_records = len(items)
    total_pages = math.ceil(total_records / page_size) if total_records > 0 else 0
    start = (page_offset - 1) * page_size
    end = start + page_size
    page_items = items[start:end]

    return page_items, PaginationInfo(
        total_records=total_records,
        page_offset=page_offset,
        page_size=page_size,
        total_pages=total_pages,
        sort_order=[SortOrder(p.order_by, p.sort_direction) for p in sort_order],
    )


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
    params = WorkflowAuditParams.model_validate(json_data)

    # First verify the user has access to the workflow
    # This will raise appropriate errors if workflow doesn't exist or user lacks access
    _ = get_workflow_and_verify_access(db_session, user, workflow_id)

    # Build the base query for workflow audit events
    workflow_audit_query = (
        select(WorkflowAudit)
        .where(WorkflowAudit.workflow_id == workflow_id)
        .options(selectinload(WorkflowAudit.acting_user))
    )

    # Execute the query
    audit_events = db_session.execute(workflow_audit_query).scalars().all()
    audit_events = apply_sorting(audit_events, params.pagination.sort_order)

    # Apply pagination
    paginated_audit_events, pagination_info = paginate_audit_events(
        audit_events,
        params.pagination.page_offset,
        params.pagination.page_size,
        params.pagination.sort_order,
    )

    return paginated_audit_events, pagination_info
