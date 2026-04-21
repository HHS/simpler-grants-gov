import logging
import os
import uuid

import click
from sqlalchemy import select
from sqlalchemy.orm import selectinload

import src.adapters.db as db
from src.adapters.db import flask_db
from src.constants.static_role_values import E2E_TEST_USER_ROLE
from src.db.models.user_models import InternalUserRole, User, UserApiKey
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)


class SetupE2eTestUserTask(Task):
    """Task that creates (or updates) an E2E test user with an API key
    and the E2E_TEST_USER_ROLE internal role, which grants the
    READ_TEST_USER_TOKEN privilege needed by the /v1/internal/e2e-token endpoint.

    This is idempotent — safe to re-run. If the user already exists,
    it will ensure the API key and role are present.
    """

    def __init__(self, db_session: db.Session, api_key: str) -> None:
        super().__init__(db_session)
        self.api_key = api_key
        self.environment: str | None = os.getenv("ENVIRONMENT", None)

        # Stable UUID so re-runs find the same user
        self.user_id = uuid.UUID("e2e01a01-0e2e-4e2e-ae2e-e2e000000001")

    def run_task(self) -> None:
        if self.environment not in ("local", "dev", "staging", "training"):
            raise Exception("ENVIRONMENT must be local, dev, staging, or training")

        with self.db_session.begin():
            user = self._get_or_create_user()
            self._ensure_api_key(user)
            self._ensure_internal_role(user)

        logger.info(
            "E2E test user setup complete",
            extra={"user_id": str(self.user_id), "api_key": self.api_key},
        )

    def _get_or_create_user(self) -> User:
        user = self.db_session.execute(
            select(User)
            .options(
                selectinload(User.api_keys),
                selectinload(User.internal_user_roles),
            )
            .where(User.user_id == self.user_id)
        ).scalar_one_or_none()

        if user is not None:
            logger.info("E2E test user already exists", extra={"user_id": str(self.user_id)})
            return user

        user = User(user_id=self.user_id)
        self.db_session.add(user)
        # Flush so relationships are loadable
        self.db_session.flush()

        logger.info("Created E2E test user", extra={"user_id": str(self.user_id)})
        return user

    def _ensure_api_key(self, user: User) -> None:
        for key in user.api_keys:
            if key.key_id == self.api_key:
                logger.info("API key already exists for E2E test user")
                return

        api_key = UserApiKey(
            user=user,
            key_id=self.api_key,
            key_name="E2E Test User API Key",
            is_active=True,
        )
        self.db_session.add(api_key)
        logger.info("Created API key for E2E test user", extra={"key_id": self.api_key})

    def _ensure_internal_role(self, user: User) -> None:
        for role in user.internal_user_roles:
            if role.role_id == E2E_TEST_USER_ROLE.role_id:
                logger.info("E2E test user already has E2E_TEST_USER_ROLE")
                return

        internal_role = InternalUserRole(user=user, role_id=E2E_TEST_USER_ROLE.role_id)
        self.db_session.add(internal_role)
        logger.info("Assigned E2E_TEST_USER_ROLE to E2E test user")


@task_blueprint.cli.command(
    "setup-e2e-test-user",
    help="Create an E2E test user with an API key and the E2E_TEST_USER_ROLE for use in non-production environments.",
)
@click.option(
    "--api-key",
    required=True,
    help="The API key (key_id) to assign to the E2E test user. This value will be used as the X-API-Key header.",
)
@flask_db.with_db_session()
@ecs_background_task(task_name="setup-e2e-test-user")
def setup_e2e_test_user(db_session: db.Session, api_key: str) -> None:
    SetupE2eTestUserTask(db_session, api_key).run()
