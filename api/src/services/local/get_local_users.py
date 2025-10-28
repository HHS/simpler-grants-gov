from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.auth.api_jwt_auth import generate_jwt
from src.db.models.user_models import User, UserTokenSession
from src.util import datetime_util
from src.util.local import error_if_not_local


def get_local_users(db_session: db.Session) -> list[dict]:
    # This logic is tied to an endpoint we only
    # want to run locally as it does no auth
    # and returns all users from the DB.
    error_if_not_local()

    users = (
        db_session.execute(
            select(User).options(
                selectinload(User.api_keys),
                selectinload(User.profile),
                selectinload(User.linked_login_gov_external_user),
            )
        )
        .scalars()
        .all()
    )

    # This is an extra check to make certain we aren't running
    # in any other environment. At the time of writing this (Oct 2025)
    # we have nearly 8000 users in prod, so this would always fail.
    if len(users) > 500:
        raise Exception(f"Too many users ({len(users)}), this isn't local, is it?")

    user_dicts = []

    for user in users:

        user_dicts.append(
            {
                "user_id": user.user_id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "oauth_id": (
                    user.linked_login_gov_external_user.external_user_id
                    if user.linked_login_gov_external_user
                    else None
                ),
                "user_jwt": _get_user_jwt(db_session, user),
                "user_api_key": _get_user_api_key(user),
            }
        )

    return user_dicts


def _get_user_jwt(db_session: db.Session, user: User) -> str | None:
    # This is really hacky and meant for local dev only
    error_if_not_local()

    # Grab the token session that expires the furthest in
    # the future. In our seed script we usually generate
    # these to expire many years out, so it's probably that one.
    user_token_session = db_session.execute(
        select(UserTokenSession)
        .where(UserTokenSession.user_id == user.user_id, UserTokenSession.is_valid.is_(True))
        .order_by(UserTokenSession.expires_at.desc())
    ).scalar()

    if user_token_session is None:
        return None

    return generate_jwt(user_token_session, datetime_util.utcnow(), user.email)


def _get_user_api_key(user: User) -> str | None:
    # This is really hacky and meant for local dev only
    error_if_not_local()

    # Arbitrarily pick any of the users API keys to return that are active
    for api_key in user.api_keys:
        if api_key.is_active:
            return api_key.key_id

    return None
