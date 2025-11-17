import uuid
from collections.abc import Sequence

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import ApplicationAudit, ApplicationForm, CompetitionForm
from src.db.models.user_models import User
from src.pagination.pagination_models import PaginationInfo, PaginationParams
from src.pagination.paginator import Paginator
from src.services.applications.get_application import get_application
from src.services.service_utils import apply_sorting


class ApplicationAuditRequest(BaseModel):
    pagination: PaginationParams


def list_application_audit(
    db_session: db.Session, application_id: uuid.UUID, user: User, request: dict
) -> tuple[list[dict], PaginationInfo]:
    # Turn the request params into something easier to work with
    params = ApplicationAuditRequest.model_validate(request)

    # Fetch the application, verifying it exists
    application = get_application(db_session, application_id, user)

    # Verify the user can access the application
    verify_access(user, {Privilege.VIEW_APPLICATION}, application)

    # Setup request, needs audit records for the app + loading relationships
    stmt = (
        select(ApplicationAudit)
        .where(ApplicationAudit.application_id == application_id)
        .options(
            # Preload the user + their profile & login.gov email
            selectinload(ApplicationAudit.user).options(
                selectinload(User.profile), selectinload(User.linked_login_gov_external_user)
            ),
            # Preload the target user + their profile & login.gov email
            selectinload(ApplicationAudit.target_user).options(
                selectinload(User.profile), selectinload(User.linked_login_gov_external_user)
            ),
            # Preload the application form + competition form + form
            selectinload(ApplicationAudit.target_application_form)
            .selectinload(ApplicationForm.competition_form)
            .selectinload(CompetitionForm.form),
            # Preload the attachment
            selectinload(ApplicationAudit.target_attachment),
        )
    )
    stmt = apply_sorting(stmt, ApplicationAudit, params.pagination.sort_order)

    # Paginate the results
    paginator: Paginator[ApplicationAudit] = Paginator(
        ApplicationAudit, stmt, db_session, page_size=params.pagination.page_size
    )
    paginated_results = paginator.page_at(page_offset=params.pagination.page_offset)
    pagination_info = PaginationInfo.from_pagination_params(params.pagination, paginator)

    # Transform the results into the expected shape for the response
    return _transform_app_audits(paginated_results), pagination_info


def _transform_app_audits(audit_events: Sequence[ApplicationAudit]) -> list[dict]:
    results = []
    for audit_event in audit_events:
        # Convert any app form into the response schema shape
        if app_form := audit_event.target_application_form:
            target_app_form = {
                "application_form_id": app_form.application_form_id,
                "competition_form_id": app_form.competition_form_id,
                "form_id": app_form.form.form_id,
                "form_name": app_form.form.form_name,
            }
        else:
            target_app_form = None

        # Most of these don't need to be modified, so we just add the DB objects
        results.append(
            {
                "application_audit_id": audit_event.application_audit_id,
                "application_audit_event": audit_event.application_audit_event,
                "user": audit_event.user,
                "target_user": audit_event.target_user,
                "target_application_form": target_app_form,
                "target_attachment": audit_event.target_attachment,
                "created_at": audit_event.created_at,
            }
        )

    return results
