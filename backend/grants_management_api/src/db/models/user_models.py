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
from sqlalchemy import UUID, ForeignKey, and_
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.constants.lookup_constants import ExternalUserType, MgmtUserType
from src.db.models.grantor_schema_table import GrantorSchemaTable
from src.db.models.lookup_models import LkExternalUserType, LkMgmtUserType


class MgmtUser(BaseUser, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_user"

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    user_type: Mapped[MgmtUserType | None] = mapped_column(
        "mgmt_user_type_id",
        LookupColumn(LkMgmtUserType),
        ForeignKey(LkMgmtUserType.mgmt_user_type_id),
        default=MgmtUserType.STANDARD,
    )

    linked_login_gov_external_user: Mapped[MgmtLinkExternalUser | None] = relationship(
        "MgmtLinkExternalUser",
        primaryjoin=lambda: and_(
            MgmtLinkExternalUser.mgmt_user_id == MgmtUser.mgmt_user_id,
            MgmtLinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV,
        ),
        uselist=False,
        viewonly=True,
    )

    api_keys: Mapped[list[MgmtUserApiKey]] = relationship(
        "MgmtUserApiKey",
        back_populates="mgmt_user",
        uselist=True,
        cascade="all, delete-orphan",
    )

    @property
    def email(self) -> str | None:
        if self.linked_login_gov_external_user is not None:
            return self.linked_login_gov_external_user.email
        return None


class MgmtLinkExternalUser(BaseLinkExternalUser, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_link_external_user"

    mgmt_link_external_user_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )

    external_user_type: Mapped[ExternalUserType] = mapped_column(
        "external_user_type_id",
        LookupColumn(LkExternalUserType),
        ForeignKey(LkExternalUserType.external_user_type_id),
        index=True,
    )

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(MgmtUser.mgmt_user_id), index=True)
    mgmt_user: Mapped[MgmtUser] = relationship(MgmtUser)

    # Columns defined in base table
    # external_user_id
    # email


class MgmtUserTokenSession(BaseUserTokenSession, GrantorSchemaTable, TimestampMixin):
    __tablename__ = "mgmt_user_token_session"

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey(MgmtUser.mgmt_user_id), primary_key=True
    )
    mgmt_user: Mapped[MgmtUser] = relationship(MgmtUser)

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    # Columns defined in base table:
    # expires_at
    # is_valid

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info"""
        return {
            "auth.token_id": self.token_id,
            "auth.user_id": self.mgmt_user_id,
        }


class MgmtLoginGovState(BaseLoginGovState, GrantorSchemaTable, TimestampMixin):
    """Table used to store temporary state during the OAuth login flow"""

    __tablename__ = "mgmt_login_gov_state"

    mgmt_login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    # nonce in base table


class MgmtUserApiKey(BaseUserApiKey, GrantorSchemaTable, TimestampMixin):
    """API Key table for user authentication to the API"""

    __tablename__ = "mgmt_user_api_key"

    mgmt_api_key_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    mgmt_user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(MgmtUser.mgmt_user_id), index=True)

    mgmt_user: Mapped[MgmtUser] = relationship(MgmtUser, back_populates="api_keys", uselist=False)

    # Defined in base table
    # key_name
    # key_id
    # last_used
    # is_active

    def get_log_extra(self) -> dict[str, Any]:
        """Get logging info"""
        return {
            "auth.api_key_id": self.mgmt_api_key_id,
            "auth.user_id": self.mgmt_user_id,
        }
