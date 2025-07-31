import logging

from src.api.route_utils import raise_flask_error
from src.constants.lookup_constants import SubmissionIssue
from src.db.models.competition_models import Application
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def check_user_application_access(application: Application, user: User) -> None:
    """
    Check if a user has access to an application.
    """
    user_has_access = any(
        app_user.user_id == user.user_id for app_user in application.application_users
    )

    if not user_has_access:
        logger.info(
            "User attempted to access an application they are not associated with",
            extra={
                "user_id": user.user_id,
                "application_id": application.application_id,
                "submission_issue": SubmissionIssue.UNAUTHORIZED_APPLICATION_ACCESS,
            },
        )
        raise_flask_error(403, "Unauthorized")
