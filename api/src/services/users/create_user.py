from datetime import date
from typing import TypedDict

from src.adapters.db import Session
from src.db.models import user_models
from src.db.models.user_models import Role, User


class RoleParams(TypedDict):
    type: user_models.RoleType


class CreateUserParams(TypedDict):
    first_name: str
    middle_name: str
    last_name: str
    phone_number: str
    date_of_birth: date
    is_active: bool
    roles: list[RoleParams]


# TODO: separate controller and service concerns
# https://github.com/navapbc/template-application-flask/issues/49#issue-1505008251
# TODO: Use classes / objects as inputs to service methods
# https://github.com/navapbc/template-application-flask/issues/52
def create_user(db_session: Session, user_params: CreateUserParams) -> User:
    with db_session.begin():
        # TODO: move this code to service and/or persistence layer
        user = User(
            first_name=user_params["first_name"],
            middle_name=user_params["middle_name"],
            last_name=user_params["last_name"],
            phone_number=user_params["phone_number"],
            date_of_birth=user_params["date_of_birth"],
            is_active=user_params["is_active"],
            roles=[Role(type=role["type"]) for role in user_params["roles"]],
        )
        db_session.add(user)
    return user
