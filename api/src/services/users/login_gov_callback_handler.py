import logging

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error
from grants_shared.auth.api_jwt_auth import JwtAuth
from grants_shared.auth.login_gov_jwt_auth import LoginGovUser, get_config
from grants_shared.services.users.login_gov_callback_handler import (
    AbstractLoginGovCallbackHandler,
    LoginGovCallbackResponse,
    LoginGovDataContainer,
)

from src.auth.auth_handler import AuthHandler
from src.db.models.user_models import LinkExternalUser, LoginGovState, User, UserTokenSession
from src.services.users.organization_from_ebiz_poc import handle_ebiz_poc_organization_during_login

logger = logging.getLogger(__name__)


class LoginGovCallbackHandler(
    AbstractLoginGovCallbackHandler[User, LinkExternalUser, LoginGovState, UserTokenSession]
):
    """Applicant-side login.gov callback handler."""

    def handle_post_login(
        self, user: User, is_user_new: bool, login_gov_user: LoginGovUser
    ) -> None:
        # Check if the user is an ebiz POC and create/link their organization
        # Only do this for new users
        if is_user_new:
            handle_ebiz_poc_organization_during_login(self.db_session, user)

        # Validate PIV requirement for agency users
        # NOTE: PIV/agency-user handling likely belongs on the grantor side once that exists.
        # Leaving it here for now so we don't break existing publish setup.
        self._validate_piv_requirement(user, login_gov_user.x509_presented)

    def _validate_piv_requirement(self, user: User, x509_presented: bool | None) -> None:
        """Validate that agency users authenticate with PIV/CAC when required.

        Args:
            user: The user attempting to log in
            x509_presented: Whether the user authenticated with a certificate (PIV/CAC)

        Raises:
            HTTPError: If an agency user attempts to login without PIV when required
        """
        config = get_config()

        # Check if user is an agency user
        is_agency_user = len(user.agency_users) > 0

        # If user is an agency user and didn't use PIV, reject or log
        if is_agency_user and not x509_presented:
            if config.is_piv_required:
                logger.info(
                    "Agency user attempted login without PIV",
                    extra={
                        "user_id": user.user_id,
                        "x509_presented": x509_presented,
                    },
                )
                raise_flask_error(
                    422,
                    "Agency users must authenticate using a PIV/CAC card",
                    extra_data={"login_piv_required_error": "true"},
                )
            else:
                logger.info(
                    "Agency user login would have been blocked if PIV were required",
                    extra={
                        "user_id": user.user_id,
                        "x509_presented": x509_presented,
                    },
                )
        elif is_agency_user and x509_presented:
            logger.info(
                "Agency user logged in with PIV",
                extra={
                    "user_id": user.user_id,
                    "x509_presented": x509_presented,
                },
            )


def _build_callback_handler(db_session: db.Session) -> LoginGovCallbackHandler:
    auth_handler = AuthHandler(db_session)
    return LoginGovCallbackHandler(auth_handler, JwtAuth(auth_handler))


def handle_login_gov_callback_request(
    query_data: dict, db_session: db.Session
) -> LoginGovDataContainer:
    return _build_callback_handler(db_session).handle_callback_request(query_data)


def handle_login_gov_token(
    db_session: db.Session, login_gov_data: LoginGovDataContainer
) -> LoginGovCallbackResponse:
    return _build_callback_handler(db_session).handle_token(login_gov_data)
