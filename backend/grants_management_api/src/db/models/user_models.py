import uuid
from typing import Any

from grants_shared.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from grants_shared.db.models.auth_base_models import (
    BaseLinkExternalUser,
    BaseLoginGovState,
    BaseUser,
    BaseUserApiKey,
    BaseUserTokenSession,
)
from grants_shared.db.models.base import TimestampMixin
from sqlalchemy import ForeignKey, and_, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.constants.lookup_constants import ExternalUserType, GrantsMgmtUserType
from src.db.models.grantor_schema_table import GrantorSchemaTable
from src.db.models.lookup_models import LkExternalUserType, LkGrantsMgmtUserType


class GrantsMgmtUser(BaseUser, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "grants_mgmt_user"

    grants_mgmt_user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    user_type: Mapped[GrantsMgmtUserType | None] = mapped_column(
        "grants_mgmt_user_type_id",
        LookupColumn(LkGrantsMgmtUserType),
        ForeignKey(LkGrantsMgmtUserType.grants_mgmt_user_type_id),
        default=GrantsMgmtUserType.STANDARD,
    )

    linked_login_gov_external_user: Mapped[GrantsMgmtLinkExternalUser | None] = relationship(
        "GrantsMgmtLinkExternalUser",
        primaryjoin=lambda: and_(
            GrantsMgmtLinkExternalUser.grants_mgmt_user_id == GrantsMgmtUser.grants_mgmt_user_id,
            GrantsMgmtLinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV,
        ),
        uselist=False,
        viewonly=True,
    )

    api_keys: Mapped[list[GrantsMgmtUserApiKey]] = relationship(
        "GrantsMgmtUserApiKey", back_populates="grants_mgmt_user", uselist=True, cascade="all, delete-orphan"
    )

    @property
    def email(self) -> str | None:
        if self.linked_login_gov_external_user is not None:
            return self.linked_login_gov_external_user.email
        return None


class GrantsMgmtLinkExternalUser(BaseLinkExternalUser, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "grants_mgmt_link_external_user"

    grants_mgmt_link_external_user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    external_user_type: Mapped[ExternalUserType] = mapped_column(
        "external_user_type_id",
        LookupColumn(LkExternalUserType),
        ForeignKey(LkExternalUserType.external_user_type_id),
        index=True,
    )

    grants_mgmt_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(GrantsMgmtUser.grants_mgmt_user_id), index=True)
    grants_mgmt_user: Mapped[GrantsMgmtUser] = relationship(GrantsMgmtUser)

    # Columns defined in base table
    # external_user_id
    # email


class GrantsMgmtUserTokenSession(BaseUserTokenSession, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "grants_mgmt_user_token_session"

    grants_mgmt_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(GrantsMgmtUser.grants_mgmt_user_id), primary_key=True)
    grants_mgmt_user: Mapped[GrantsMgmtUser] = relationship(GrantsMgmtUser)

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    # Columns defined in base table:
    # expires_at
    # is_valid

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info"""
        return {
            "auth.token_id": self.token_id,
            "auth.user_id": self.grants_mgmt_user_id,
        }

class GrantsMgmtLoginGovState(BaseLoginGovState, GrantorSchemaTable, TimestampMixin):
    """Table used to store temporary state during the OAuth login flow"""

    __tablename__ = "grants_mgmt_login_gov_state"

    grants_mgmt_login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    # nonce in base table


class GrantsMgmtUserApiKey(BaseUserApiKey, GrantorSchemaTable, TimestampMixin):
    """API Key table for user authentication to the API"""

    __tablename__ = "grants_mgmt_user_api_key"

    grants_mgmt_api_key_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    grants_mgmt_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(GrantsMgmtUser.grants_mgmt_user_id), index=True)

    grants_mgmt_user: Mapped[GrantsMgmtUser] = relationship(GrantsMgmtUser, back_populates="api_keys", uselist=False)

    # Defined in base table
    # key_name
    # key_id
    # last_used
    # is_active

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info"""
        return {
            "auth.api_key_id": self.grants_mgmt_api_key_id,
            "auth.user_id": self.grants_mgmt_user_id,
        }