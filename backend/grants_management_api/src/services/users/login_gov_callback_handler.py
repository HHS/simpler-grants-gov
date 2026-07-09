from grants_shared.adapters import db
from grants_shared.auth.api_jwt_auth import JwtAuth
from grants_shared.auth.login_gov_jwt_auth import LoginGovUser
from grants_shared.services.users.login_gov_callback_handler import (
    AbstractLoginGovCallbackHandler,
    LoginGovCallbackResponse,
    LoginGovDataContainer,
)

from src.auth.auth_handler import MgmtAuthHandler
from src.db.models.user_models import (
    MgmtLinkExternalUser,
    MgmtLoginGovState,
    MgmtUser,
    MgmtUserTokenSession,
)


def get_callback_handler(db_session: db.Session) -> MgmtLoginGovCallbackHandler:
    auth_handler = MgmtAuthHandler(db_session)
    return MgmtLoginGovCallbackHandler(auth_handler, JwtAuth(auth_handler))


def handle_login_gov_callback_request(
    query_data: dict, db_session: db.Session
) -> LoginGovDataContainer:
    return get_callback_handler(db_session).handle_callback_request(query_data)


def handle_login_gov_token(
    db_session: db.Session, login_gov_data: LoginGovDataContainer
) -> LoginGovCallbackResponse:
    return get_callback_handler(db_session).handle_token(login_gov_data)


class MgmtLoginGovCallbackHandler(
    AbstractLoginGovCallbackHandler[
        MgmtUser,
        MgmtLinkExternalUser,
        MgmtLoginGovState,
        MgmtUserTokenSession,
    ]
):
    """Applicant-side login.gov callback handler."""

    def handle_post_login(
        self, user: MgmtUser, is_user_new: bool, login_gov_user: LoginGovUser
    ) -> None:
        # Validate PIV requirement for agency users
        # NOTE: PIV/agency-user handling likely belongs on the grantor side once that exists.
        # Leaving it here for now so we don't break existing publish setup.
        self._validate_piv_requirement(user, login_gov_user.x509_presented)

    def _validate_piv_requirement(self, user: MgmtUser, x509_presented: bool | None) -> None:
        """Validate that agency users authenticate with PIV/CAC when required.

        Args:
            user: The user attempting to log in
            x509_presented: Whether the user authenticated with a certificate (PIV/CAC)

        Raises:
            HTTPError: If an agency user attempts to login without PIV when required
        """
        # TODO - we won't yet implement this because the first check in the logic
        #        needs to know whether a user is an agency user. We don't know if this should apply
        #        to every user, or a specific set of users yet, so leaving it out of the first iteration
        #        as we'd disable it while we get the system setup anyways.
        pass
