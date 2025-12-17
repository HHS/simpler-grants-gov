import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.sql import Select

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import ApplicationSubmission
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.applications.get_application import get_application
from src.services.service_utils import apply_sorting


class ApplicationSubmissionsRequest(BaseModel):
    pagination: PaginationParams


def list_application_submissions(
    db_session: db.Session, application_id: uuid.UUID, user: User, request: dict
) -> tuple[list[dict], PaginationInfo]:
    """List all application submissions for an application."""

    params = ApplicationSubmissionsRequest.model_validate(request)
    application = get_application(db_session, application_id, user)
    verify_access(user, {Privilege.VIEW_APPLICATION}, application)

    stmt: Select = select(ApplicationSubmission).where(
        ApplicationSubmission.application_id == application_id
    )
    stmt = apply_sorting(stmt, ApplicationSubmission, params.pagination.sort_order)

    paginator: Paginator[ApplicationSubmission] = Paginator(
        ApplicationSubmission, stmt, db_session, page_size=params.pagination.page_size
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    return _transform_submissions(paginated_results), pagination_info


def _transform_submissions(submissions: Sequence[ApplicationSubmission]) -> list[dict]:
    """Transform application submissions into the response format."""
    results = []
    for submission in submissions:
        results.append(
            {
                "application_submission_id": submission.application_submission_id,
                "download_path": submission.download_path,
                "file_size_bytes": submission.file_size_bytes,
                "legacy_tracking_number": submission.legacy_tracking_number,
            }
        )

    return results
