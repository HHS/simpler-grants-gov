"""Provision the internal user the file-scan Lambda authenticates as.

The ClamAV scanner Lambda calls ``POST /v1/files/<file_id>`` with an
``X-API-Key`` header to report scan results. That key must resolve to a user
holding the ``INTERNAL_S3_SCAN`` privilege. The privilege's role
(``INTERNAL_S3_SCANNER_ROLE``) is synced into every database automatically by
``sync_lookup_values``; this service creates the *user*, links the role, and
registers the API key.

It is exposed through ``POST /v1/internal/file-scan-scanner-user`` rather than a
CLI task so the API key value never lands in a logged command line (the task
runner logs ``sys.argv``). The endpoint is gated on the ``MANAGE_INTERNAL_ROLES``
privilege, which only our own internal admin role holds, and the key travels in
the request body over TLS.

The provisioning is idempotent so it can be re-run after a key rotation: the
user, role link, and key are each created only if missing.
"""

import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.api.route_utils import raise_flask_error
from sqlalchemy import select

from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege, UserType
from src.constants.static_role_values import INTERNAL_S3_SCANNER_ROLE_ID
from src.db.models.user_models import InternalUserRole, User, UserApiKey

logger = logging.getLogger(__name__)

# Stable, well-known id for the singleton file-scan scanner user so callers
# resolve the same identity on every run. Local development seeds its own
# scanner user (LOCAL_FILE_SCANNER_USER_ID) separately.
INTERNAL_S3_SCANNER_USER_ID = uuid.UUID("f1c0b2a4-9d3e-4a7b-8c61-0e5d2f8a4b13")

SCANNER_API_KEY_NAME = "File scan scanner key"


def setup_file_scan_scanner_user(
    db_session: db.Session,
    requesting_user: User,
    api_key: str,
    user_id: uuid.UUID = INTERNAL_S3_SCANNER_USER_ID,
) -> User:
    """Create/ensure the scanner user, its INTERNAL_S3_SCAN role, and API key.

    Caller owns the transaction. ``requesting_user`` is the authenticated API-key
    user; access is gated on the ``MANAGE_INTERNAL_ROLES`` privilege.
    """
    verify_access(requesting_user, {Privilege.MANAGE_INTERNAL_ROLES}, None)

    user = _ensure_user(db_session, user_id)
    _ensure_internal_role(user)
    _ensure_api_key(db_session, user, api_key)
    logger.info("Finished provisioning file-scan scanner user", extra={"user_id": user_id})
    return user


def _ensure_user(db_session: db.Session, user_id: uuid.UUID) -> User:
    user = db_session.scalars(select(User).where(User.user_id == user_id)).one_or_none()
    if user is not None:
        return user

    user = User(user_id=user_id, user_type=UserType.INTERNAL_SYSTEM_USER)
    db_session.add(user)
    logger.info("Created file-scan scanner user", extra={"user_id": user_id})
    return user


def _ensure_internal_role(user: User) -> None:
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
        extra={"user_id": user.user_id, "role_id": INTERNAL_S3_SCANNER_ROLE_ID},
    )


def _ensure_api_key(db_session: db.Session, user: User, api_key: str) -> None:
    existing = db_session.scalars(
        select(UserApiKey).where(UserApiKey.key_id == api_key)
    ).one_or_none()
    if existing is not None:
        if existing.user_id != user.user_id:
            # The key already belongs to someone else — refuse rather than
            # silently authenticating the scanner as the wrong user.
            raise_flask_error(409, "Provided API key is already registered to a different user")
        # Re-running after the key was deactivated should re-enable it.
        existing.is_active = True
        logger.info("File-scan scanner API key already present", extra={"user_id": user.user_id})
        return

    # Direct insert (no AWS API Gateway import): this key is validated only
    # against the user_api_key table by the X-API-Key auth, same as the
    # locally-seeded scanner key.
    new_api_key = UserApiKey(
        api_key_id=uuid.uuid4(),
        user=user,
        key_name=SCANNER_API_KEY_NAME,
        key_id=api_key,
        is_active=True,
    )
    db_session.add(new_api_key)
    logger.info(
        "Registered file-scan scanner API key",
        extra={"user_id": user.user_id, "api_key_id": new_api_key.api_key_id},
    )
