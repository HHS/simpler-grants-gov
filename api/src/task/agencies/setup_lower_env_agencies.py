import logging
import os
import secrets
import string
from collections.abc import Sequence
from datetime import date
from enum import StrEnum

from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.db import flask_db
from src.constants.lookup_constants import AgencySubmissionNotificationSetting
from src.constants.static_role_values import OPPORTUNITY_PUBLISHER
from src.db.models.agency_models import Agency
from src.db.models.user_models import AgencyUser, AgencyUserRole, Role, User, UserType
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util

logger = logging.getLogger(__name__)


class SetupLowerEnvAgenciesTask(Task):
    """Task that creates fake Agencies, one for each user,
    and assigns them the opportunity_publisher role.
    """

    class Metrics(StrEnum):
        USER_COUNT = "user_count"
        HAS_EXISTING_AGENCY_COUNT = "has_existing_agency_count"
        NEW_AGENCY_COUNT = "new_agency_count"

    def __init__(self, db_session: db.Session, current_date: date | None = None) -> None:
        super().__init__(db_session)

        if current_date is None:
            current_date = datetime_util.get_now_us_eastern_date()

        self.current_date = current_date

        self.environment: str | None = os.getenv("ENVIRONMENT", None)

    def run_task(self) -> None:
        # We do not want to let this task run outside of our development
        # environments. While it shouldn't be configured to do so, this
        # is making extra certain that that is the case.
        if self.environment not in ("local", "dev", "staging"):
            raise Exception("ENVIRONMENT must be local, dev or staging")

        with self.db_session.begin():
            users = self.get_users()

            # For each user, create a fake agency and assign them the
            # opportunity_publisher role. If a user already has a fake
            # agency, skip it.
            for user in users:
                self.increment(self.Metrics.USER_COUNT)
                if not self.has_agency(user):
                    agency = self.create_fake_agency()
                    self.assign_agency_user(user, agency, OPPORTUNITY_PUBLISHER)

    def get_users(self) -> Sequence[User]:
        """Get all users"""
        users = (
            self.db_session.execute(
                select(User)
                .options(selectinload(User.agency_users).selectinload(AgencyUser.agency))
                .where(User.user_type == UserType.STANDARD)
            )
            .scalars()
            .all()
        )
        return users

    def has_agency(self, user: User) -> bool:
        """Check if this user already has a fake agency or not"""
        for agency_user in user.agency_users:
            agency = agency_user.agency
            if agency.agency_code.startswith("AUTO"):
                self.increment(self.Metrics.HAS_EXISTING_AGENCY_COUNT)
                logger.info(
                    "User has an existing fake agency",
                    extra={"agency_code": agency.agency_code, "user_id": user.user_id},
                )
                return True

        logger.info(
            "User does not have an existing fake agency",
            extra={"user_id": user.user_id},
        )
        return False

    def create_fake_agency(self) -> Agency:
        """Create a fake agency"""
        unique_code = self.generate_agency_code()
        agency = Agency(
            agency_code=unique_code,
            agency_name="Agency for " + unique_code,
            assistance_listing_number="00.000",
            agency_submission_notification_setting=AgencySubmissionNotificationSetting.ALWAYS,
            is_test_agency=False,
        )
        self.db_session.add(agency)
        logger.debug(
            "New fake agency created",
            extra={"agency_code": agency.agency_code, "agency_id": agency.agency_id},
        )
        return agency

    def assign_agency_user(self, user: User, agency: Agency, role: Role) -> None:
        """Assign the user to this agency"""
        agency_user = AgencyUser(agency=agency, user=user)
        self.db_session.add(agency_user)

        agency_user_role = AgencyUserRole(agency_user=agency_user, role_id=role.role_id)
        self.db_session.add(agency_user_role)

        logger.info(
            "User assigned to new agency with a role",
            extra={
                "agency_code": agency.agency_code,
                "user_id": user.user_id,
                "role": role.role_name,
            },
        )

    def generate_agency_code(self) -> str:
        """Generate an agency code"""
        for _ in range(5):
            new_code = "AUTO" + "".join(secrets.choice(string.ascii_uppercase) for _ in range(8))

            existing_record = self.db_session.execute(
                select(Agency).where(Agency.agency_code == new_code)
            ).scalar_one_or_none()

            if existing_record is None:
                self.increment(self.Metrics.NEW_AGENCY_COUNT)
                return new_code

        raise Exception("Could not generate a unique agency_code after 5 attempts")


@task_blueprint.cli.command(
    "setup-lower-env-agencies", help="Utility to automatically create agencies for users"
)
@flask_db.with_db_session()
@ecs_background_task(task_name="setup-lower-env-agencies")
def generate_agency_sql(db_session: db.Session) -> None:
    SetupLowerEnvAgenciesTask(db_session).run()
