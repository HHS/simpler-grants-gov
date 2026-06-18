"""Provision the internal user the file-scan Lambda authenticates as.

The ClamAV scanner Lambda calls ``POST /v1/files/<file_id>`` with an
``X-API-Key`` header to report scan results. That key must resolve to a user
holding the ``INTERNAL_S3_SCAN`` privilege. The privilege's role
(``INTERNAL_S3_SCANNER_ROLE``) is synced into every database automatically by
``sync_lookup_values``; this task creates the *user*, links the role, and
registers the API key.

It is idempotent so it can run on every deploy (or be re-run after a key
rotation): the user, role link, and key are each created only if missing. The
API key value is read from ``--api-key`` / ``FILE_SCAN_API_KEY`` so it can be
sourced from the same secret the Lambda's env var is wired to, guaranteeing the
DB row and the Lambda agree.

Run via the task CLI, e.g. ``flask task setup-file-scan-scanner-user``.
"""

import logging
import uuid

import click
import grants_shared.adapters.db.flask_db as flask_db
from grants_shared.adapters import db
from grants_shared.task.ecs_background_task import ecs_background_task
from sqlalchemy import select

from src.constants.lookup_constants import JobType, UserType
from src.constants.static_role_values import INTERNAL_S3_SCANNER_ROLE_ID
from src.db.models.user_models import InternalUserRole, User, UserApiKey
from src.task.task import Task
from src.task.task_blueprint import task_blueprint

logger = logging.getLogger(__name__)

# Stable, well-known id for the singleton file-scan scanner user so this task
# resolves the same identity on every run. Local development seeds its own
# scanner user (LOCAL_FILE_SCANNER_USER_ID) separately.
INTERNAL_S3_SCANNER_USER_ID = uuid.UUID("f1c0b2a4-9d3e-4a7b-8c61-0e5d2f8a4b13")

SCANNER_API_KEY_NAME = "File scan scanner key"


@task_blueprint.cli.command(
    "setup-file-scan-scanner-user",
    help="Create/ensure the internal file-scan scanner user, its INTERNAL_S3_SCAN role, and API key",
)
@click.option(
    "--api-key",
    "api_key",
    envvar="FILE_SCAN_API_KEY",
    required=True,
    help="API key value (X-API-Key) to register for the scanner user. Defaults to the FILE_SCAN_API_KEY env var.",
)
@click.option(
    "--user-id",
    "user_id",
    default=str(INTERNAL_S3_SCANNER_USER_ID),
    show_default=True,
    help="UUID to use for the scanner user.",
)
@flask_db.with_db_session()
@ecs_background_task(task_name=JobType.SETUP_FILE_SCAN_SCANNER_USER)
def setup_file_scan_scanner_user(db_session: db.Session, api_key: str, user_id: str) -> None:
    SetupFileScanScannerUserTask(db_session, uuid.UUID(user_id), api_key).run_task()


class SetupFileScanScannerUserTask(Task):
    def __init__(self, db_session: db.Session, user_id: uuid.UUID, api_key: str):
        super().__init__(db_session)
        self.user_id = user_id
        self.api_key = api_key

    def run_task(self) -> None:
        with self.db_session.begin():
            self.provision()
        logger.info("Finished provisioning file-scan scanner user", extra={"user_id": self.user_id})

    def provision(self) -> User:
        """Create/ensure the user, role link, and API key. Caller owns the
        transaction (run_task wraps this in ``db_session.begin()``)."""
        user = self._ensure_user()
        self._ensure_internal_role(user)
        self._ensure_api_key(user)
        return user

    def _ensure_user(self) -> User:
        user = self.db_session.scalars(
            select(User).where(User.user_id == self.user_id)
        ).one_or_none()
        if user is not None:
            return user

        user = User(user_id=self.user_id, user_type=UserType.INTERNAL_SYSTEM_USER)
        self.db_session.add(user)
        logger.info("Created file-scan scanner user", extra={"user_id": self.user_id})
        return user

    def _ensure_internal_role(self, user: User) -> None:
        already_assigned = any(
            link.role_id == INTERNAL_S3_SCANNER_ROLE_ID for link in user.internal_user_roles
        )
        if already_assigned:
            return

        user.internal_user_roles.append(
            InternalUserRole(user=user, role_id=INTERNAL_S3_SCANNER_ROLE_ID)
        )
        logger.info(
            "Assigned INTERNAL_S3_SCANNER role to scanner user",
            extra={"user_id": self.user_id, "role_id": INTERNAL_S3_SCANNER_ROLE_ID},
        )

    def _ensure_api_key(self, user: User) -> None:
        existing = self.db_session.scalars(
            select(UserApiKey).where(UserApiKey.key_id == self.api_key)
        ).one_or_none()
        if existing is not None:
            if existing.user_id != self.user_id:
                # The key already belongs to someone else — refuse rather than
                # silently authenticating the scanner as the wrong user.
                raise ValueError("Provided API key is already registered to a different user")
            # Re-running after the key was deactivated should re-enable it.
            existing.is_active = True
            logger.info(
                "File-scan scanner API key already present", extra={"user_id": self.user_id}
            )
            return

        # Direct insert (no AWS API Gateway import): this key is validated only
        # against the user_api_key table by the X-API-Key auth, same as the
        # locally-seeded scanner key.
        api_key = UserApiKey(
            api_key_id=uuid.uuid4(),
            user=user,
            key_name=SCANNER_API_KEY_NAME,
            key_id=self.api_key,
            is_active=True,
        )
        self.db_session.add(api_key)
        logger.info(
            "Registered file-scan scanner API key",
            extra={"user_id": self.user_id, "api_key_id": api_key.api_key_id},
        )
