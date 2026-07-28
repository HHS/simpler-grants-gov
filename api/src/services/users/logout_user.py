import logging

from grants_shared.adapters import db
from grants_shared.auth.api_jwt_auth import JwtAuth
from grants_shared.auth.auth_errors import JwtValidationError

from src.auth.auth_handler import AuthHandler

logger = logging.getLogger(__name__)


def logout_user(db_session: db.Session, user_token: str | None) -> None:
    if user_token is None:
        logger.info("No token provided, no user to logout")
        return

    # Attempt to parse the JWT that was provided, same as we would for authN normally.
    # If there are any JWT-specific issues, we'll just log them, and still proceed with
    # the redirect logic that comes after this.
    try:
        user_token_session = JwtAuth(AuthHandler(db_session)).parse_jwt_for_user(user_token)
    except JwtValidationError:
        logger.info("Provided JWT was not valid, cannot logout of our system", exc_info=True)
        return

    user_token_session.is_valid = False

    logger.info("Logged user out of simpler grants", extra=user_token_session.get_log_extra())
