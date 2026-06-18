import uuid

import pytest
from sqlalchemy import func, select

from src.constants.lookup_constants import UserType
from src.constants.static_role_values import INTERNAL_S3_SCANNER_ROLE_ID
from src.db.models.user_models import InternalUserRole, User, UserApiKey
from src.task.files.setup_file_scan_scanner_user_task import (
    INTERNAL_S3_SCANNER_USER_ID,
    SetupFileScanScannerUserTask,
)
from tests.conftest import BaseTestClass
from tests.src.db.models.factories import UserApiKeyFactory, UserFactory


class TestSetupFileScanScannerUserTask(BaseTestClass):
    def test_provisions_user_role_and_key(self, enable_factory_create, db_session):
        api_key = f"scanner-key-{uuid.uuid4()}"

        SetupFileScanScannerUserTask(db_session, INTERNAL_S3_SCANNER_USER_ID, api_key).provision()

        user = db_session.scalars(
            select(User).where(User.user_id == INTERNAL_S3_SCANNER_USER_ID)
        ).one()
        assert user.user_type == UserType.INTERNAL_SYSTEM_USER
        assert any(link.role_id == INTERNAL_S3_SCANNER_ROLE_ID for link in user.internal_user_roles)

        key = db_session.scalars(select(UserApiKey).where(UserApiKey.key_id == api_key)).one()
        assert key.user_id == INTERNAL_S3_SCANNER_USER_ID
        assert key.is_active is True

    def test_is_idempotent(self, enable_factory_create, db_session):
        api_key = f"scanner-key-{uuid.uuid4()}"
        user_id = uuid.uuid4()

        for _ in range(2):
            SetupFileScanScannerUserTask(db_session, user_id, api_key).provision()

        assert (
            db_session.scalar(select(func.count()).select_from(User).where(User.user_id == user_id))
            == 1
        )
        assert (
            db_session.scalar(
                select(func.count())
                .select_from(InternalUserRole)
                .where(InternalUserRole.user_id == user_id)
            )
            == 1
        )
        assert (
            db_session.scalar(
                select(func.count()).select_from(UserApiKey).where(UserApiKey.key_id == api_key)
            )
            == 1
        )

    def test_reactivates_deactivated_key(self, enable_factory_create, db_session):
        api_key = f"scanner-key-{uuid.uuid4()}"
        user_id = uuid.uuid4()
        UserApiKeyFactory.create(
            user=UserFactory.create(user_id=user_id), key_id=api_key, is_active=False
        )

        SetupFileScanScannerUserTask(db_session, user_id, api_key).provision()

        key = db_session.scalars(select(UserApiKey).where(UserApiKey.key_id == api_key)).one()
        assert key.is_active is True

    def test_rejects_key_owned_by_another_user(self, enable_factory_create, db_session):
        api_key = f"scanner-key-{uuid.uuid4()}"
        UserApiKeyFactory.create(key_id=api_key)  # belongs to some other (factory) user

        with pytest.raises(ValueError, match="already registered to a different user"):
            SetupFileScanScannerUserTask(
                db_session, INTERNAL_S3_SCANNER_USER_ID, api_key
            ).provision()
