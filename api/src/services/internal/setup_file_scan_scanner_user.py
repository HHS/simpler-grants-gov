"""Provision the internal user the file-scan Lambda authenticates as.

The ClamAV scanner Lambda calls ``POST /v1/files/<file_id>`` with an
``X-API-Key`` header to report scan results. That key must resolve to a user
holding the ``INTERNAL_S3_SCAN`` privilege. The privilege's role
(``INTERNAL_S3_SCANNER_ROLE``) is synced into every database automatically by
``sync_lookup_values``; this service creates the *user*, links the role, and
mints a fresh API key, returning the generated key to the caller (the only time
the plaintext key is exposed -- store it in the scanner's secret).

It is exposed through ``POST /v1/internal/file-scan-scanner-user`` rather than a
CLI task so the generated key value never lands in a logged command line (the
task runner logs ``sys.argv``). The endpoint is gated on the
``MANAGE_INTERNAL_ROLES`` privilege, which only our own internal admin role
holds, and the key travels back in the response body over TLS.

The user and role link are idempotent -- created only if missing -- so the
endpoint can be re-run to rotate the key: each call mints and returns a new key
for the same scanner user.
"""

import logging
import uuid

import grants_shared.adapters.db as db
from grants_shared.util.api_key_gen import generate_api_key_id
from sqlalchemy import select

from src.auth.auth_handler import AuthHandler
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege, UserType
from src.constants.static_role_values import INTERNAL_S3_SCANNER_ROLE_ID
from src.db.models.user_models import InternalUserRole, User, UserApiKey

logger = logging.getLogger(__name__)

SCANNER_API_KEY_NAME = "File scan scanner key"

# Number of times to retry key generation if we happen to collide with an
# existing key_id before giving up.
MAX_KEY_GENERATION_RETRIES = 5


class KeyGenerationError(Exception):
    """Raised when unable to generate a unique API key after multiple retries."""


def setup_file_scan_scanner_user(
    db_session: db.Session,
    requesting_user: User,
    user_id: uuid.UUID,
) -> UserApiKey:
    """Create/ensure the scanner user and its INTERNAL_S3_SCAN role, then mint a
    fresh API key for it and return the new key.

    Caller owns the transaction. ``requesting_user`` is the authenticated API-key
    user; access is gated on the ``MANAGE_INTERNAL_ROLES`` privilege.
    """
    verify_access(requesting_user, {Privilege.MANAGE_INTERNAL_ROLES}, None)

    user = _ensure_user(db_session, user_id)
    _ensure_internal_role(user)
    api_key = _create_api_key(db_session, user)
    logger.info("Finished provisioning file-scan scanner user", extra={"user_id": user_id})
    return api_key


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


def _create_api_key(db_session: db.Session, user: User) -> UserApiKey:
    # Mint the key through the shared auth handler (no AWS API Gateway import):
    # this key is validated only against the user_api_key table by the
    # X-API-Key auth, same as the locally-seeded scanner key.
    api_key = AuthHandler(db_session).create_api_key(
        user.user_id, SCANNER_API_KEY_NAME, _generate_unique_key_id(db_session)
    )
    logger.info(
        "Registered file-scan scanner API key",
        extra={"user_id": user.user_id} | api_key.get_log_extra(),
    )
    return api_key


def _generate_unique_key_id(db_session: db.Session) -> str:
    for _attempt in range(MAX_KEY_GENERATION_RETRIES):
        key_id = generate_api_key_id()
        existing = db_session.scalars(
            select(UserApiKey).where(UserApiKey.key_id == key_id)
        ).one_or_none()
        if existing is None:
            return key_id

    logger.error(
        "Failed to generate unique key_id after maximum retries",
        extra={"max_retries": MAX_KEY_GENERATION_RETRIES},
    )
    raise KeyGenerationError(
        f"Unable to generate unique API key after {MAX_KEY_GENERATION_RETRIES} attempts"
    )
