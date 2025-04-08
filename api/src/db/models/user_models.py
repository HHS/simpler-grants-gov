import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, and_
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import now as sqlnow

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn
from src.constants.lookup_constants import ExternalUserType
from src.db.models.base import ApiSchemaTable, TimestampMixin
from src.db.models.lookup_models import LkExternalUserType
from src.db.models.opportunity_models import Opportunity
from src.util import datetime_util


class User(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    saved_opportunities: Mapped[list["UserSavedOpportunity"]] = relationship(
        "UserSavedOpportunity",
        back_populates="user",
        uselist=True,
        cascade="all, delete-orphan",
    )

    saved_searches: Mapped[list["UserSavedSearch"]] = relationship(
        "UserSavedSearch", back_populates="user", uselist=True, cascade="all, delete-orphan"
    )

    linked_login_gov_external_user: Mapped["LinkExternalUser | None"] = relationship(
        "LinkExternalUser",
        primaryjoin=lambda: and_(
            LinkExternalUser.user_id == User.user_id,
            LinkExternalUser.external_user_type == ExternalUserType.LOGIN_GOV,
        ),
        uselist=False,
        viewonly=True,
    )

    @property
    def email(self) -> str | None:
        if self.linked_login_gov_external_user is not None:
            return self.linked_login_gov_external_user.email
        return None


class LinkExternalUser(ApiSchemaTable, TimestampMixin):
    __tablename__ = "link_external_user"

    link_external_user_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    external_user_id: Mapped[str] = mapped_column(index=True, unique=True)

    external_user_type: Mapped[ExternalUserType] = mapped_column(
        "external_user_type_id",
        LookupColumn(LkExternalUserType),
        ForeignKey(LkExternalUserType.external_user_type_id),
        index=True,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    email: Mapped[str]


class UserTokenSession(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_token_session"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), primary_key=True)
    user: Mapped[User] = relationship(User)

    token_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)

    expires_at: Mapped[datetime]

    # When a user logs out, we set this flag to False.
    is_valid: Mapped[bool] = mapped_column(default=True)


class LoginGovState(ApiSchemaTable, TimestampMixin):
    """Table used to store temporary state during the OAuth login flow"""

    __tablename__ = "login_gov_state"

    login_gov_state_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True)

    # https://openid.net/specs/openid-connect-core-1_0.html#NonceNotes
    nonce: Mapped[uuid.UUID]


class UserSavedOpportunity(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_saved_opportunity"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), primary_key=True)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), primary_key=True
    )

    last_notified_at: Mapped[datetime] = mapped_column(
        default=datetime_util.utcnow, server_default="NOW()", nullable=False
    )

    user: Mapped[User] = relationship(User, back_populates="saved_opportunities")
    opportunity: Mapped[Opportunity] = relationship(
        "Opportunity", back_populates="saved_opportunities_by_users"
    )


class UserSavedSearch(ApiSchemaTable, TimestampMixin):
    """Table for storing saved search queries for users"""

    __tablename__ = "user_saved_search"

    saved_search_id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User, back_populates="saved_searches")

    search_query: Mapped[dict] = mapped_column(JSONB)

    name: Mapped[str]

    last_notified_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime_util.utcnow,
        server_default=sqlnow(),
    )

    searched_opportunity_ids: Mapped[list[uuid.UUID]] = mapped_column(ARRAY(UUID))


class UserNotificationLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_notification_log"

    user_notification_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    notification_reason: Mapped[str]
    notification_sent: Mapped[bool]


class UserOpportunityNotificationLog(ApiSchemaTable, TimestampMixin):
    __tablename__ = "user_opportunity_notification_log"

    user_opportunity_notification_log_id: Mapped[uuid.UUID] = mapped_column(
        UUID, primary_key=True, default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey(User.user_id), index=True)
    user: Mapped[User] = relationship(User)

    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID, ForeignKey(Opportunity.opportunity_id), index=True
    )
    opportunity: Mapped[Opportunity] = relationship(
        "Opportunity", back_populates="all_opportunity_notification_logs"
    )
