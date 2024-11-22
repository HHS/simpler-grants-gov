import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.api_jwt_auth import create_jwt_for_user
from src.auth.auth_errors import JwtValidationError
from src.auth.login_gov_jwt_auth import validate_token
from src.constants.lookup_constants import ExternalUserType
from src.db.models.user_models import LinkExternalUser, User

logger = logging.getLogger(__name__)


def process_login_gov_token(token: str, db_session: db.Session) -> dict:

    try:
        login_gov_user = validate_token(token)
    except JwtValidationError as e:
        logger.info("Login.gov token validation failed", extra={"auth.issue": e.message})
        raise_flask_error(401, e.message)

    external_user: LinkExternalUser | None = db_session.execute(
        select(LinkExternalUser)
        .where(LinkExternalUser.external_user_id == login_gov_user.user_id)
        # We only support login.gov right now, so this does nothing, but let's
        # be explicit just in case.
        .where(LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV)
        .options(selectinload("*"))
    ).scalar()

    is_user_new = external_user is None

    # If we didn't find anything, we want to create the user
    if external_user is None:
        external_user = _create_login_gov_user(login_gov_user.user_id, db_session)

    # Update fields on the external user table
    external_user.email = login_gov_user.email

    # Flush the records to the DB so any auto-generated IDs and similar are populated
    # prior to us trying to work with the user further.
    # NOTE: This doesn't commit yet - but effectively moves the cache from memory to the DB transaction
    db_session.flush()

    token, _ = create_jwt_for_user(external_user.user, db_session)

    # TODO - make a pydantic object? return token + user? Figure it out
    return _build_response(token, external_user, is_user_new)


def _create_login_gov_user(external_user_id: str, db_session: db.Session) -> LinkExternalUser:
    user = User()
    db_session.add(user)

    external_user = LinkExternalUser(
        user=user,
        external_user_type=ExternalUserType.LOGIN_GOV,
        external_user_id=external_user_id,
        # note we set other params in the calling method to also handle updates
    )
    db_session.add(external_user)

    return external_user


def _build_response(token: str, external_user: LinkExternalUser, is_user_new: bool) -> dict:
    return {
        "token": token,
        "user": {
            "user_id": external_user.user_id,
            "email": external_user.email,
            "external_user_type": external_user.external_user_type,
        },
        "is_user_new": is_user_new,
    }
