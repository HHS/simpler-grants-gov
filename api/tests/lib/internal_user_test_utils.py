from src.adapters import db
from src.auth.api_jwt_auth import create_jwt_for_user
from src.constants.lookup_constants import Privilege
from src.db.models.user_models import Role, User
from tests.src.db.models.factories import (
    InternalUserRoleFactory,
    LinkExternalUserFactory,
    RoleFactory,
    UserApiKeyFactory,
    UserFactory,
    UserProfileFactory,
)


def create_internal_user(
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str = None,
    first_name: str = None,
    last_name: str = None,
) -> User:
    user = UserFactory.create()

    link_kwargs = {"user": user}
    if email is not None:
        link_kwargs["email"] = email
    LinkExternalUserFactory.create(**link_kwargs)

    # Create user profile if first_name or last_name provided
    if first_name is not None or last_name is not None:
        profile_kwargs = {"user": user}
        if first_name is not None:
            profile_kwargs["first_name"] = first_name
        if last_name is not None:
            profile_kwargs["last_name"] = last_name
        UserProfileFactory.create(**profile_kwargs)

    if privileges:
        role = RoleFactory.create(privileges=privileges, is_internal_role=True)

    if role is not None:
        InternalUserRoleFactory.create(user=user, role=role)

    return user


def create_internal_user_with_jwt(
    db_session: db.Session,
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str = None,
    first_name: str = None,
    last_name: str = None,
) -> tuple[User, str]:
    user = create_internal_user(
        role=role,
        privileges=privileges,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    token, _ = create_jwt_for_user(user, db_session)
    db_session.commit()  # commit to push JWT to DB

    return user, token


def create_internal_user_with_api_key(
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str = None,
    first_name: str = None,
    last_name: str = None,
) -> tuple[User, str]:

    user = create_internal_user(
        role=role,
        privileges=privileges,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    api_key = UserApiKeyFactory.create(user=user)
    return user, api_key.key_id


def create_internal_user_with_jwt_and_api_key(
    db_session: db.Session,
    role: Role | None = None,
    privileges: list[Privilege] | None = None,
    email: str = None,
    first_name: str = None,
    last_name: str = None,
) -> tuple[User, str, str]:

    user, token = create_internal_user_with_jwt(
        db_session=db_session,
        role=role,
        privileges=privileges,
        email=email,
        first_name=first_name,
        last_name=last_name,
    )

    api_key = UserApiKeyFactory.create(user=user)
    return user, token, api_key.key_id
